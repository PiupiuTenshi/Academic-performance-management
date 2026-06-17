import { pool } from "../src/config/database.js";

const studentCode = process.argv[2] || "N23DCCN015";
const semesterId = Number(process.argv[3] || 1);

try {
  const [rows] = await pool.query(
    `
      SELECT
        st.student_code AS studentCode,
        c.course_code AS courseCode,
        c.name AS courseName,
        g.attendance_score AS attendance,
        g.assignment_score AS assignment,
        g.midterm_score AS midterm,
        g.final_score AS final,
        g.total_score AS total,
        g.status
      FROM grades g
      JOIN enrollments e ON e.id = g.enrollment_id
      JOIN students st ON st.id = e.student_id
      JOIN class_sections cs ON cs.id = e.class_section_id
      JOIN courses c ON c.id = cs.course_id
      WHERE st.student_code = ?
        AND cs.semester_id = ?
      ORDER BY c.course_code
    `,
    [studentCode, semesterId],
  );

  const [record] = await pool.query(
    `
      SELECT
        st.student_code AS studentCode,
        ar.average_score AS averageScore,
        ar.total_credits AS totalCredits,
        ar.classification
      FROM academic_records ar
      JOIN students st ON st.id = ar.student_id
      WHERE st.student_code = ?
        AND ar.semester_id = ?
    `,
    [studentCode, semesterId],
  );

  console.log(`Grades for ${studentCode}, semester ${semesterId}`);
  console.table(rows);
  console.log("Academic record");
  console.table(record);
} finally {
  await pool.end();
}
