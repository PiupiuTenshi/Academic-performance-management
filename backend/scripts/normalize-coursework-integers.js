import { pool } from "../src/config/database.js";

async function summarize(connection, label) {
  const [rows] = await connection.query(`
    SELECT
      COUNT(*) AS gradeRows,
      SUM(attendance_score IS NOT NULL AND attendance_score <> ROUND(attendance_score)) AS fractionalAttendance,
      SUM(assignment_score IS NOT NULL AND assignment_score <> ROUND(assignment_score)) AS fractionalAssignment
    FROM grades
  `);

  const [statusRows] = await connection.query(`
    SELECT status, COUNT(*) AS count
    FROM grades
    GROUP BY status
    ORDER BY status
  `);

  console.log(`\n${label}`);
  console.table(rows);
  console.table(statusRows);
}

async function recalculateAcademicRecords(connection) {
  const [semesterIds] = await connection.query(`
    SELECT DISTINCT cs.semester_id AS semesterId
    FROM grades g
    JOIN enrollments e ON e.id = g.enrollment_id
    JOIN class_sections cs ON cs.id = e.class_section_id
    WHERE g.total_score IS NOT NULL
  `);

  for (const { semesterId } of semesterIds) {
    const [records] = await connection.execute(
      `
        SELECT
          e.student_id AS studentId,
          ROUND(SUM(g.total_score * c.credits) / SUM(c.credits), 2) AS averageScore,
          SUM(c.credits) AS totalCredits
        FROM grades g
        JOIN enrollments e ON e.id = g.enrollment_id
        JOIN class_sections cs ON cs.id = e.class_section_id
        JOIN courses c ON c.id = cs.course_id
        WHERE cs.semester_id = ?
          AND g.total_score IS NOT NULL
        GROUP BY e.student_id
      `,
      [semesterId],
    );

    for (const record of records) {
      const average = Number(record.averageScore);
      const classification =
        average >= 8 ? "excellent" :
        average >= 6.5 ? "good" :
        average >= 5 ? "average" :
        "weak";

      await connection.execute(
        `
          INSERT INTO academic_records (student_id, semester_id, average_score, total_credits, classification)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            average_score = VALUES(average_score),
            total_credits = VALUES(total_credits),
            classification = VALUES(classification)
        `,
        [record.studentId, semesterId, average, record.totalCredits, classification],
      );
    }
  }
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await summarize(connection, "Before");
    await connection.beginTransaction();

    await connection.query(`
      UPDATE grades
      SET
        attendance_score = CASE
          WHEN attendance_score IS NULL THEN NULL
          ELSE ROUND(attendance_score)
        END,
        assignment_score = CASE
          WHEN assignment_score IS NULL THEN NULL
          ELSE ROUND(assignment_score)
        END
    `);

    await connection.query(`
      UPDATE grades
      SET
        total_score = ROUND(
          attendance_score * 0.1
          + assignment_score * 0.2
          + midterm_score * 0.2
          + final_score * 0.5,
          1
        ),
        status = CASE
          WHEN ROUND(
            attendance_score * 0.1
            + assignment_score * 0.2
            + midterm_score * 0.2
            + final_score * 0.5,
            1
          ) >= 4 THEN 'passed'
          WHEN ROUND(
            attendance_score * 0.1
            + assignment_score * 0.2
            + midterm_score * 0.2
            + final_score * 0.5,
            1
          ) >= 3 THEN 'retake'
          ELSE 'repeat'
        END
      WHERE attendance_score IS NOT NULL
        AND assignment_score IS NOT NULL
        AND midterm_score IS NOT NULL
        AND final_score IS NOT NULL
        AND status <> 'draft'
    `);

    await connection.query("DELETE rr FROM retake_results rr JOIN grades g ON g.id = rr.grade_id WHERE g.status = 'passed'");
    await connection.query(`
      UPDATE retake_results rr
      JOIN grades g ON g.id = rr.grade_id
      SET rr.status = g.status
      WHERE g.status IN ('retake', 'repeat')
    `);
    await connection.query(`
      INSERT INTO retake_results (student_id, course_id, semester_id, grade_id, status, note)
      SELECT
        e.student_id,
        cs.course_id,
        cs.semester_id,
        g.id,
        g.status,
        CASE
          WHEN g.status = 'retake' THEN 'Auto sync after coursework integer normalization'
          ELSE 'Auto sync after coursework integer normalization'
        END
      FROM grades g
      JOIN enrollments e ON e.id = g.enrollment_id
      JOIN class_sections cs ON cs.id = e.class_section_id
      LEFT JOIN retake_results rr ON rr.grade_id = g.id
      WHERE g.status IN ('retake', 'repeat')
        AND rr.id IS NULL
    `);

    await recalculateAcademicRecords(connection);
    await connection.commit();
    await summarize(connection, "After");
  } catch (error) {
    await connection.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
