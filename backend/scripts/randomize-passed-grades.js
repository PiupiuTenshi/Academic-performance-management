import { pool } from "../src/config/database.js";

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeRealisticPassedGrade(row) {
  const rand = seededRandom(row.gradeId * 1009 + row.studentId * 131 + row.courseId * 17);
  const courseShift = ((row.courseId % 7) - 3) * 0.12;
  const studentShift = ((row.studentId % 11) - 5) * 0.08;
  const base = clamp(5.0 + rand() * 3.4 + courseShift + studentShift, 4.6, 8.8);

  const attendanceScore = round1(clamp(base + 0.5 + rand() * 1.2, 5.0, 9.8));
  const assignmentScore = round1(clamp(base + (rand() - 0.35) * 1.5, 4.6, 9.4));
  const midtermScore = round1(clamp(base + (rand() - 0.5) * 1.8, 4.2, 9.2));

  const targetTotal = round1(base);
  const finalRaw = (targetTotal - attendanceScore * 0.1 - assignmentScore * 0.2 - midtermScore * 0.2) / 0.5;
  const finalScore = round1(clamp(finalRaw + (rand() - 0.5) * 0.6, 4.0, 9.3));
  let totalScore = round1(attendanceScore * 0.1 + assignmentScore * 0.2 + midtermScore * 0.2 + finalScore * 0.5);

  if (totalScore < 4.0) {
    totalScore = 4.0;
  }

  return {
    attendanceScore,
    assignmentScore,
    midtermScore,
    finalScore,
    totalScore,
  };
}

async function summarize(connection, label) {
  const [rows] = await connection.query(`
    SELECT
      s.id AS semesterId,
      s.name,
      s.academic_year AS academicYear,
      g.status,
      COUNT(*) AS count,
      COUNT(DISTINCT CONCAT_WS('|', g.attendance_score, g.assignment_score, g.midterm_score, g.final_score, g.total_score)) AS distinctCombos,
      MIN(g.total_score) AS minTotal,
      MAX(g.total_score) AS maxTotal
    FROM grades g
    JOIN enrollments e ON e.id = g.enrollment_id
    JOIN class_sections cs ON cs.id = e.class_section_id
    JOIN semesters s ON s.id = cs.semester_id
    GROUP BY s.id, s.name, s.academic_year, g.status
    ORDER BY s.id, g.status
  `);
  console.log(`\n${label}`);
  console.table(rows);
}

async function recalculateAcademicRecords(connection, semesterIds) {
  for (const semesterId of semesterIds) {
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

async function updateGradeBatch(connection, updates) {
  if (updates.length === 0) return;

  const fields = [
    "attendance_score",
    "assignment_score",
    "midterm_score",
    "final_score",
    "total_score",
  ];
  const valueKeys = [
    "attendanceScore",
    "assignmentScore",
    "midtermScore",
    "finalScore",
    "totalScore",
  ];

  const params = [];
  const setClauses = fields.map((field, index) => {
    const cases = updates.map((item) => {
      params.push(item.gradeId, item[valueKeys[index]]);
      return "WHEN ? THEN ?";
    }).join(" ");
    return `${field} = CASE id ${cases} ELSE ${field} END`;
  });

  const ids = updates.map((item) => item.gradeId);
  params.push(...ids);

  await connection.query(
    `
      UPDATE grades
      SET
        ${setClauses.join(",\n        ")},
        status = 'passed'
      WHERE id IN (${ids.map(() => "?").join(", ")})
    `,
    params,
  );
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await summarize(connection, "Before");

    await connection.beginTransaction();

    const [passedGrades] = await connection.query(`
      SELECT
        g.id AS gradeId,
        e.student_id AS studentId,
        cs.course_id AS courseId,
        cs.semester_id AS semesterId
      FROM grades g
      JOIN enrollments e ON e.id = g.enrollment_id
      JOIN class_sections cs ON cs.id = e.class_section_id
      WHERE g.status = 'passed'
      ORDER BY g.id
    `);

    const semesterIds = new Set();
    const updates = passedGrades.map((row) => {
      const next = makeRealisticPassedGrade(row);
      semesterIds.add(row.semesterId);
      return { gradeId: row.gradeId, ...next };
    });

    const batchSize = 200;
    for (let index = 0; index < updates.length; index += batchSize) {
      await updateGradeBatch(connection, updates.slice(index, index + batchSize));
    }

    await recalculateAcademicRecords(connection, [...semesterIds]);
    await connection.commit();

    console.log(`\nUpdated ${passedGrades.length} passed grade rows.`);
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
