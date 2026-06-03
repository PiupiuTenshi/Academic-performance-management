import { pool, query } from "../config/database.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

function classifyCourse(totalScore, rule) {
  if (totalScore >= Number(rule.passing_score ?? 4)) {
    return "passed";
  }

  if (totalScore >= Number(rule.retake_score ?? 3)) {
    return "retake";
  }

  return "repeat";
}

function classifyAcademic(avg) {
  if (avg >= 8) return "excellent";
  if (avg >= 6.5) return "good";
  if (avg >= 5) return "average";
  return "weak";
}

export async function calculateFinalScores(req, res) {
  const classSectionId = Number(req.body.classSectionId);

  if (!classSectionId) {
    throw new ApiError(400, "VALIDATION_ERROR", "classSectionId is required");
  }

  const classRows = await query(
    `SELECT cs.id, cs.course_id AS courseId, cs.is_grade_locked AS isGradeLocked
     FROM class_sections cs
     WHERE cs.id = ?
     LIMIT 1`,
    [classSectionId],
  );
  const classSection = classRows[0];

  if (!classSection) {
    throw new ApiError(404, "NOT_FOUND", "Class section not found");
  }

  if (!classSection.isGradeLocked) {
    throw new ApiError(409, "CONFLICT", "Grade sheet must be locked before calculating final scores");
  }

  const ruleRows = await query("SELECT * FROM grade_rules WHERE course_id = ? LIMIT 1", [
    classSection.courseId,
  ]);
  const rule = ruleRows[0] || {
    attendance_weight: 0.1,
    assignment_weight: 0.2,
    midterm_weight: 0.2,
    final_weight: 0.5,
    passing_score: 4,
    retake_score: 3,
  };

  const grades = await query(
    `SELECT g.id, g.attendance_score, g.assignment_score, g.midterm_score, g.final_score
     FROM grades g
     JOIN enrollments e ON e.id = g.enrollment_id
     WHERE e.class_section_id = ?`,
    [classSectionId],
  );

  const connection = await pool.getConnection();
  let calculatedCount = 0;

  try {
    await connection.beginTransaction();

    for (const grade of grades) {
      if (
        grade.attendance_score == null ||
        grade.assignment_score == null ||
        grade.midterm_score == null ||
        grade.final_score == null
      ) {
        continue;
      }

      const totalScore =
        Number(grade.attendance_score) * Number(rule.attendance_weight) +
        Number(grade.assignment_score) * Number(rule.assignment_weight) +
        Number(grade.midterm_score) * Number(rule.midterm_weight) +
        Number(grade.final_score) * Number(rule.final_weight);
      const roundedTotal = Math.round(totalScore * 10) / 10;
      const status = classifyCourse(roundedTotal, rule);

      await connection.execute("UPDATE grades SET total_score = ?, status = ? WHERE id = ?", [
        roundedTotal,
        status,
        grade.id,
      ]);
      calculatedCount += 1;
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  sendSuccess(res, {
    classSectionId,
    calculatedCount,
  });
}

export async function classifySemester(req, res) {
  const semesterId = Number(req.body.semesterId);

  if (!semesterId) {
    throw new ApiError(400, "VALIDATION_ERROR", "semesterId is required");
  }

  const unfinishedRows = await query(
    `SELECT COUNT(*) AS unfinishedCount
     FROM class_sections cs
     JOIN enrollments e ON e.class_section_id = cs.id
     LEFT JOIN grades g ON g.enrollment_id = e.id
     WHERE cs.semester_id = ?
       AND (g.total_score IS NULL)`,
    [semesterId],
  );

  if (Number(unfinishedRows[0].unfinishedCount) > 0) {
    throw new ApiError(409, "CONFLICT", "Semester still has unfinished grades");
  }

  const averages = await query(
    `SELECT
       e.student_id AS studentId,
       SUM(g.total_score * c.credits) / SUM(c.credits) AS averageScore,
       SUM(c.credits) AS totalCredits
     FROM enrollments e
     JOIN class_sections cs ON cs.id = e.class_section_id
     JOIN courses c ON c.id = cs.course_id
     JOIN grades g ON g.enrollment_id = e.id
     WHERE cs.semester_id = ?
     GROUP BY e.student_id`,
    [semesterId],
  );

  const connection = await pool.getConnection();
  let classifiedCount = 0;

  try {
    await connection.beginTransaction();

    for (const item of averages) {
      const averageScore = Math.round(Number(item.averageScore) * 100) / 100;
      const classification = classifyAcademic(averageScore);

      await connection.execute(
        `INSERT INTO academic_records (student_id, semester_id, average_score, total_credits, classification)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           average_score = VALUES(average_score),
           total_credits = VALUES(total_credits),
           classification = VALUES(classification),
           updated_at = CURRENT_TIMESTAMP`,
        [item.studentId, semesterId, averageScore, item.totalCredits, classification],
      );
      classifiedCount += 1;
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  sendSuccess(res, {
    semesterId,
    classifiedCount,
  });
}

