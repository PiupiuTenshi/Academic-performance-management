import { pool, query } from "../config/database.js";
import { writeAuditLog } from "../services/audit-log.service.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

function validateScore(value, field) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be a number from 0 to 10`);
  }
}

function normalizeGradePayload(payload) {
  const grade = {
    attendanceScore: payload.attendanceScore ?? null,
    assignmentScore: payload.assignmentScore ?? null,
    midtermScore: payload.midtermScore ?? null,
    finalScore: payload.finalScore ?? null,
  };

  validateScore(grade.attendanceScore, "attendanceScore");
  validateScore(grade.assignmentScore, "assignmentScore");
  validateScore(grade.midtermScore, "midtermScore");
  validateScore(grade.finalScore, "finalScore");

  return grade;
}

async function ensureClassCanReceiveGrades(user, classSectionId) {
  const rows = await query(
    `SELECT cs.id, cs.is_grade_locked AS isGradeLocked, gep.is_open AS isPeriodOpen
     FROM class_sections cs
     JOIN lecturers l ON l.id = cs.lecturer_id
     LEFT JOIN grade_entry_periods gep
       ON gep.semester_id = cs.semester_id
      AND gep.is_open = TRUE
     WHERE cs.id = ?
       AND l.user_id = ?
     LIMIT 1`,
    [classSectionId, user.id],
  );

  const classSection = rows[0];

  if (!classSection) {
    throw new ApiError(403, "FORBIDDEN", "Lecturer is not assigned to this class");
  }

  if (classSection.isGradeLocked) {
    throw new ApiError(409, "CONFLICT", "Grade sheet is locked");
  }

  if (!classSection.isPeriodOpen) {
    throw new ApiError(403, "FORBIDDEN", "Grade entry period is closed");
  }
}

export async function saveBulkGrades(req, res) {
  const classSectionId = Number(req.body.classSectionId);
  const grades = Array.isArray(req.body.grades) ? req.body.grades : [];

  if (!classSectionId || grades.length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "classSectionId and grades are required");
  }

  await ensureClassCanReceiveGrades(req.user, classSectionId);

  const connection = await pool.getConnection();
  const errors = [];
  let savedCount = 0;

  try {
    await connection.beginTransaction();

    for (const item of grades) {
      try {
        const enrollmentId = Number(item.enrollmentId);
        const grade = normalizeGradePayload(item);

        if (!enrollmentId) {
          throw new ApiError(422, "VALIDATION_ERROR", "enrollmentId is required");
        }

        const [enrollmentRows] = await connection.execute(
          "SELECT id FROM enrollments WHERE id = ? AND class_section_id = ? LIMIT 1",
          [enrollmentId, classSectionId],
        );

        if (!enrollmentRows[0]) {
          throw new ApiError(404, "NOT_FOUND", "Enrollment not found in class");
        }

        const [oldRows] = await connection.execute("SELECT * FROM grades WHERE enrollment_id = ? LIMIT 1", [
          enrollmentId,
        ]);

        await connection.execute(
          `INSERT INTO grades (
             enrollment_id, attendance_score, assignment_score, midterm_score, final_score
           )
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             attendance_score = VALUES(attendance_score),
             assignment_score = VALUES(assignment_score),
             midterm_score = VALUES(midterm_score),
             final_score = VALUES(final_score),
             updated_at = CURRENT_TIMESTAMP`,
          [
            enrollmentId,
            grade.attendanceScore,
            grade.assignmentScore,
            grade.midtermScore,
            grade.finalScore,
          ],
        );

        await connection.execute(
          `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, old_value, new_value)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            "UPSERT_GRADE",
            "grades",
            enrollmentId,
            oldRows[0] ? JSON.stringify(oldRows[0]) : null,
            JSON.stringify(grade),
          ],
        );

        savedCount += 1;
      } catch (error) {
        errors.push({
          enrollmentId: item.enrollmentId,
          code: error.code || "ROW_ERROR",
          message: error.message,
        });
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  sendSuccess(res, {
    savedCount,
    failedCount: errors.length,
    errors,
  });
}

export async function updateGrade(req, res) {
  const gradeId = Number(req.params.id);
  const grade = normalizeGradePayload(req.body);

  if (!gradeId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid grade id");
  }

  const rows = await query(
    `SELECT g.*, e.class_section_id AS classSectionId, cs.is_grade_locked AS isGradeLocked
     FROM grades g
     JOIN enrollments e ON e.id = g.enrollment_id
     JOIN class_sections cs ON cs.id = e.class_section_id
     WHERE g.id = ?
     LIMIT 1`,
    [gradeId],
  );
  const oldGrade = rows[0];

  if (!oldGrade) {
    throw new ApiError(404, "NOT_FOUND", "Grade not found");
  }

  if (req.user.role === "lecturer") {
    await ensureClassCanReceiveGrades(req.user, oldGrade.classSectionId);
  }

  if (req.user.role === "academic_staff" && oldGrade.isGradeLocked) {
    // Academic Staff can adjust locked grades for correction, audit log records the change.
  }

  await query(
    `UPDATE grades
     SET attendance_score = ?,
         assignment_score = ?,
         midterm_score = ?,
         final_score = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [grade.attendanceScore, grade.assignmentScore, grade.midtermScore, grade.finalScore, gradeId],
  );

  await writeAuditLog({
    actorUserId: req.user.id,
    action: "UPDATE_GRADE",
    entityType: "grades",
    entityId: gradeId,
    oldValue: oldGrade,
    newValue: grade,
  });

  sendSuccess(res, {
    id: gradeId,
    ...grade,
  });
}

