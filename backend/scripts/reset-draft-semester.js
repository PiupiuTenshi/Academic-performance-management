import { pool } from "../src/config/database.js";

const semesterId = Number(process.argv[2]);

if (!semesterId) {
  console.error("Usage: node scripts/reset-draft-semester.js <semesterId>");
  process.exit(1);
}

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();

  await connection.execute(
    `
      UPDATE grades g
      JOIN enrollments e ON e.id = g.enrollment_id
      JOIN class_sections cs ON cs.id = e.class_section_id
      SET g.status = 'draft',
          g.total_score = NULL
      WHERE cs.semester_id = ?
        AND g.status != 'draft'
    `,
    [semesterId],
  );

  await connection.execute(
    `
      DELETE rr
      FROM retake_results rr
      JOIN grades g ON g.id = rr.grade_id
      JOIN enrollments e ON e.id = g.enrollment_id
      JOIN class_sections cs ON cs.id = e.class_section_id
      WHERE cs.semester_id = ?
    `,
    [semesterId],
  );

  await connection.execute("DELETE FROM academic_records WHERE semester_id = ?", [semesterId]);
  await connection.commit();

  console.log(`Reset semester ${semesterId} grades to draft.`);
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
