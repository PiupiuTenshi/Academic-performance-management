import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const sourceCsvDir = path.join(rootDir, "database/source-csv");

const demoPasswordHash = "$2b$10$teOi3V5PqpyEUrm76n52iuMhcSmqJY5DVxWdaUSFF9V93WbtKZD16";

const studentFiles = [
  { file: "d23cqcn01.csv", groupCode: "D23CQCN01-N", sectionSuffix: "01" },
  { file: "d23cqcn02.csv", groupCode: "D23CQCN02-N", sectionSuffix: "02" },
  { file: "d23cqcn03.csv", groupCode: "D23CQCN03-N", sectionSuffix: "03" },
];

const semesterFiles = [
  {
    file: "Hoc_ky_1_2025_2026_co_tin_chi.csv",
    name: "Hoc ky 1",
    label: "HK1",
    academicYear: "2025-2026",
    startsOn: "2025-09-01",
    endsOn: "2026-01-15",
    periodName: "Dot nhap diem HK1",
    periodStartsAt: "2025-12-01 00:00:00",
    periodEndsAt: "2026-01-31 23:59:59",
    isOpen: false,
    hasGrades: true,
  },
  {
    file: "Hoc_ky_2_2025_2026_co_tin_chi.csv",
    name: "Hoc ky 2",
    label: "HK2",
    academicYear: "2025-2026",
    startsOn: "2026-02-01",
    endsOn: "2026-06-30",
    periodName: "Dot nhap diem HK2",
    periodStartsAt: "2026-05-01 00:00:00",
    periodEndsAt: "2026-07-15 23:59:59",
    isOpen: true,
    hasGrades: false,
  },
];

const lecturers = [
  ["lecturer01", "GV001", "Trần Thị Mai", "lecturer01@example.com"],
  ["lecturer02", "GV002", "Nguyễn Minh Đức", "lecturer02@example.com"],
  ["lecturer03", "GV003", "Phạm Thu Hà", "lecturer03@example.com"],
  ["lecturer04", "GV004", "Lê Quang Huy", "lecturer04@example.com"],
];

const baseUsers = [
  ["admin", "admin"],
  ["academic01", "academic_staff"],
];

const oldDemoCourseCodes = ["CS101", "DB201", "WEB301", "SE401"];
const oldDemoSectionCodes = [
  "CS101-01",
  "CS101-02",
  "DB201-01",
  "DB201-02",
  "WEB301-01",
  "WEB301-02",
  "SE401-01",
  "SE401-02",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

async function readCsvRows(file) {
  const text = await fs.readFile(path.join(sourceCsvDir, file), "utf8");
  const rows = parseCsv(text);
  const header = rows[0].map((cell) => cell.replace(/^\uFEFF/, "").trim());

  return rows.slice(1).map((cells) => {
    const item = {};
    header.forEach((name, index) => {
      item[name] = (cells[index] || "").trim();
    });
    return item;
  });
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;
}

function tuple(values) {
  return `(${values.map(sql).join(", ")})`;
}

function valuesInsert(table, columns, rows, duplicateUpdateColumns = []) {
  if (rows.length === 0) return "";

  const updateClause = duplicateUpdateColumns.length
    ? `\nON DUPLICATE KEY UPDATE\n  ${duplicateUpdateColumns
        .map((column) => `${column} = VALUES(${column})`)
        .join(",\n  ")}`
    : "";

  return `INSERT INTO ${table} (${columns.join(", ")})\nVALUES\n  ${rows
    .map(tuple)
    .join(",\n  ")}${updateClause};`;
}

function scoreProfile(index) {
  if (index % 17 === 0) {
    return [2.5, 2.8, 2.5, 2.7];
  }
  if (index % 10 === 0) {
    return [4.0, 3.2, 3.0, 3.1];
  }
  if (index % 4 === 0) {
    return [9.0, 8.5, 8.0, 9.0];
  }
  if (index % 4 === 1) {
    return [8.0, 7.0, 7.0, 7.5];
  }
  if (index % 4 === 2) {
    return [6.5, 6.0, 5.5, 6.0];
  }
  return [7.0, 7.0, 7.0, 7.0];
}

function totalScore(scores) {
  return Math.round((scores[0] * 0.1 + scores[1] * 0.2 + scores[2] * 0.2 + scores[3] * 0.5) * 10) / 10;
}

function gradeStatus(total) {
  if (total >= 4) return "passed";
  if (total >= 3) return "retake";
  return "repeat";
}

function classification(average) {
  if (average >= 8) return "excellent";
  if (average >= 6.5) return "good";
  if (average >= 5) return "average";
  return "weak";
}

const studentGroups = [];
let studentIndex = 0;

for (const source of studentFiles) {
  const rows = await readCsvRows(source.file);
  const students = rows.map((row) => {
    studentIndex += 1;
    return {
      index: studentIndex,
      username: row["Mã SV"],
      groupCode: row["Lớp"] || source.groupCode,
      sectionSuffix: source.sectionSuffix,
      studentCode: row["Mã SV"],
      fullName: row["Họ tên SV"],
      email: `${row["Mã SV"].toLowerCase()}@student.ptithcm.edu.vn`,
    };
  });

  studentGroups.push({
    ...source,
    students,
  });
}

const students = studentGroups.flatMap((group) => group.students);
const semesters = [];
const courses = [];
const classSections = [];

for (const semesterSource of semesterFiles) {
  const courseRows = await readCsvRows(semesterSource.file);
  const semester = {
    ...semesterSource,
    courses: courseRows.map((row) => ({
      courseCode: row["Mã MH"],
      name: row["Tên môn học"],
      credits: Number(row["Số tín chỉ"]),
    })),
  };
  semesters.push(semester);
  courses.push(...semester.courses);

  semester.courses.forEach((course, courseIndex) => {
    studentGroups.forEach((group) => {
      classSections.push({
        sectionCode: `${course.courseCode}-${group.sectionSuffix}`,
        courseCode: course.courseCode,
        semesterName: semester.name,
        academicYear: semester.academicYear,
        lecturerCode: lecturers[(courseIndex + Number(group.sectionSuffix) - 1) % lecturers.length][1],
        isGradeLocked: semester.hasGrades,
        sectionSuffix: group.sectionSuffix,
        hasGrades: semester.hasGrades,
      });
    });
  });
}

const generatedCourseCodes = [...new Set(courses.map((course) => course.courseCode))];
const generatedSectionCodes = classSections.map((section) => section.sectionCode);
const cleanupCourseCodes = [...new Set([...oldDemoCourseCodes, ...generatedCourseCodes])];
const cleanupSectionCodes = [...new Set([...oldDemoSectionCodes, ...generatedSectionCodes])];

const lines = [
  "-- Generated by backend/scripts/generate-demo-data.js from database/source-csv/*.csv.",
  "-- Re-run npm run db:demo:build after changing the CSV source files.",
  `SET @demo_password_hash = ${sql(demoPasswordHash)};`,
  "",
  "-- Clean old generated class/course data so demo runs reflect the current CSV files.",
  `DELETE rr FROM retake_results rr
LEFT JOIN grades g ON g.id = rr.grade_id
LEFT JOIN enrollments e ON e.id = g.enrollment_id
LEFT JOIN class_sections cs ON cs.id = e.class_section_id
LEFT JOIN courses c ON c.id = rr.course_id
WHERE cs.section_code IN (${cleanupSectionCodes.map(sql).join(", ")})
   OR c.course_code IN (${cleanupCourseCodes.map(sql).join(", ")});`,
  `DELETE g FROM grades g
JOIN enrollments e ON e.id = g.enrollment_id
JOIN class_sections cs ON cs.id = e.class_section_id
WHERE cs.section_code IN (${cleanupSectionCodes.map(sql).join(", ")});`,
  `DELETE e FROM enrollments e
JOIN class_sections cs ON cs.id = e.class_section_id
WHERE cs.section_code IN (${cleanupSectionCodes.map(sql).join(", ")});`,
  `DELETE FROM class_sections
WHERE section_code IN (${cleanupSectionCodes.map(sql).join(", ")});`,
  `DELETE ar FROM academic_records ar
JOIN students st ON st.id = ar.student_id
JOIN users u ON u.id = st.user_id
JOIN semesters se ON se.id = ar.semester_id
WHERE u.username LIKE 'student%'
  AND se.name IN (${semesters.map((semester) => sql(semester.name)).join(", ")})
  AND se.academic_year = '2025-2026';`,
  `DELETE gr FROM grade_rules gr
JOIN courses c ON c.id = gr.course_id
WHERE c.course_code IN (${oldDemoCourseCodes.map(sql).join(", ")});`,
  `DELETE FROM courses
WHERE course_code IN (${oldDemoCourseCodes.map(sql).join(", ")});`,
  "",
  valuesInsert(
    "users",
    ["username", "password_hash", "role"],
    baseUsers.map(([username, role]) => [username, demoPasswordHash, role]),
    ["password_hash", "role", "is_active"],
  ).replace("is_active = VALUES(is_active)", "is_active = TRUE"),
  "",
  valuesInsert(
    "users",
    ["username", "password_hash", "role"],
    lecturers.map(([username]) => [username, demoPasswordHash, "lecturer"]),
    ["password_hash", "role", "is_active"],
  ).replace("is_active = VALUES(is_active)", "is_active = TRUE"),
  "",
  valuesInsert(
    "users",
    ["username", "password_hash", "role"],
    students.map((student) => [student.username, demoPasswordHash, "student"]),
    ["password_hash", "role", "is_active"],
  ).replace("is_active = VALUES(is_active)", "is_active = TRUE"),
  "",
  valuesInsert(
    "lecturers",
    ["user_id", "lecturer_code", "full_name", "email"],
    lecturers.map(([username, lecturerCode, fullName, email]) => [
      { raw: `(SELECT id FROM users WHERE username = ${sql(username)} LIMIT 1)` },
      lecturerCode,
      fullName,
      email,
    ]),
  ),
];

function rawSql(value) {
  if (typeof value === "object" && value?.raw) return value.raw;
  return sql(value);
}

function rawTuple(values) {
  return `(${values.map(rawSql).join(", ")})`;
}

function rawValuesInsert(table, columns, rows, duplicateUpdateColumns = []) {
  if (rows.length === 0) return "";

  const updateClause = duplicateUpdateColumns.length
    ? `\nON DUPLICATE KEY UPDATE\n  ${duplicateUpdateColumns
        .map((column) => `${column} = VALUES(${column})`)
        .join(",\n  ")}`
    : "";

  return `INSERT INTO ${table} (${columns.join(", ")})\nVALUES\n  ${rows
    .map(rawTuple)
    .join(",\n  ")}${updateClause};`;
}

lines[lines.length - 1] = rawValuesInsert(
  "lecturers",
  ["user_id", "lecturer_code", "full_name", "email"],
  lecturers.map(([username, lecturerCode, fullName, email]) => [
    { raw: `(SELECT id FROM users WHERE username = ${sql(username)} LIMIT 1)` },
    lecturerCode,
    fullName,
    email,
  ]),
  ["user_id", "lecturer_code", "full_name", "email"],
);

lines.push(
  "",
  rawValuesInsert(
    "students",
    ["user_id", "student_code", "full_name", "email"],
    students.map((student) => [
      { raw: `(SELECT id FROM users WHERE username = ${sql(student.username)} LIMIT 1)` },
      student.studentCode,
      student.fullName,
      student.email,
    ]),
    ["user_id", "student_code", "full_name", "email"],
  ),
  "",
  valuesInsert(
    "courses",
    ["course_code", "name", "credits"],
    courses.map((course) => [course.courseCode, course.name, course.credits]),
    ["name", "credits"],
  ),
  "",
  valuesInsert(
    "semesters",
    ["name", "academic_year", "starts_on", "ends_on"],
    semesters.map((semester) => [semester.name, semester.academicYear, semester.startsOn, semester.endsOn]),
    ["starts_on", "ends_on"],
  ),
  "",
  rawValuesInsert(
    "grade_rules",
    [
      "course_id",
      "attendance_weight",
      "assignment_weight",
      "midterm_weight",
      "final_weight",
      "passing_score",
      "retake_score",
    ],
    generatedCourseCodes.map((courseCode) => [
      { raw: `(SELECT id FROM courses WHERE course_code = ${sql(courseCode)} LIMIT 1)` },
      0.1,
      0.2,
      0.2,
      0.5,
      4,
      3,
    ]),
    [
      "attendance_weight",
      "assignment_weight",
      "midterm_weight",
      "final_weight",
      "passing_score",
      "retake_score",
    ],
  ),
  "",
  rawValuesInsert(
    "grade_entry_periods",
    ["semester_id", "name", "starts_at", "ends_at", "is_open"],
    semesters.map((semester) => [
      {
        raw: `(SELECT id FROM semesters WHERE name = ${sql(semester.name)} AND academic_year = ${sql(
          semester.academicYear,
        )} LIMIT 1)`,
      },
      semester.periodName,
      semester.periodStartsAt,
      semester.periodEndsAt,
      semester.isOpen,
    ]),
    ["starts_at", "ends_at", "is_open"],
  ),
  "",
  rawValuesInsert(
    "class_sections",
    ["section_code", "course_id", "semester_id", "lecturer_id", "is_grade_locked"],
    classSections.map((section) => [
      section.sectionCode,
      { raw: `(SELECT id FROM courses WHERE course_code = ${sql(section.courseCode)} LIMIT 1)` },
      {
        raw: `(SELECT id FROM semesters WHERE name = ${sql(section.semesterName)} AND academic_year = ${sql(
          section.academicYear,
        )} LIMIT 1)`,
      },
      { raw: `(SELECT id FROM lecturers WHERE lecturer_code = ${sql(section.lecturerCode)} LIMIT 1)` },
      section.isGradeLocked,
    ]),
    ["course_id", "semester_id", "lecturer_id", "is_grade_locked"],
  ),
);

const enrollmentRows = [];
for (const semester of semesters) {
  for (const course of semester.courses) {
    for (const group of studentGroups) {
      const sectionCode = `${course.courseCode}-${group.sectionSuffix}`;
      for (const student of group.students) {
        enrollmentRows.push([
          { raw: `(SELECT id FROM students WHERE student_code = ${sql(student.studentCode)} LIMIT 1)` },
          { raw: `(SELECT id FROM class_sections WHERE section_code = ${sql(sectionCode)} LIMIT 1)` },
        ]);
      }
    }
  }
}

lines.push(
  "",
  rawValuesInsert("enrollments", ["student_id", "class_section_id"], enrollmentRows, ["enrolled_at"]).replace(
    "enrolled_at = VALUES(enrolled_at)",
    "enrolled_at = enrolled_at",
  ),
);

const gradeRows = [];
const academicAccumulator = new Map();

for (const semester of semesters.filter((item) => item.hasGrades)) {
  for (const course of semester.courses) {
    for (const group of studentGroups) {
      const sectionCode = `${course.courseCode}-${group.sectionSuffix}`;
      for (const student of group.students) {
        const scores = scoreProfile(student.index);
        const total = totalScore(scores);
        const status = gradeStatus(total);
        const current = academicAccumulator.get(student.studentCode) || {
          weightedScore: 0,
          credits: 0,
          semester,
        };

        current.weightedScore += total * course.credits;
        current.credits += course.credits;
        academicAccumulator.set(student.studentCode, current);

        gradeRows.push([
          {
            raw: `(SELECT e.id FROM enrollments e JOIN students st ON st.id = e.student_id JOIN class_sections cs ON cs.id = e.class_section_id WHERE st.student_code = ${sql(
              student.studentCode,
            )} AND cs.section_code = ${sql(sectionCode)} LIMIT 1)`,
          },
          scores[0],
          scores[1],
          scores[2],
          scores[3],
          total,
          status,
        ]);
      }
    }
  }
}

lines.push(
  "",
  rawValuesInsert(
    "grades",
    [
      "enrollment_id",
      "attendance_score",
      "assignment_score",
      "midterm_score",
      "final_score",
      "total_score",
      "status",
    ],
    gradeRows,
    [
      "attendance_score",
      "assignment_score",
      "midterm_score",
      "final_score",
      "total_score",
      "status",
    ],
  ),
  "",
  `INSERT INTO retake_results (student_id, course_id, semester_id, grade_id, status, note)
SELECT
  e.student_id,
  cs.course_id,
  cs.semester_id,
  g.id,
  g.status,
  CASE
    WHEN g.status = 'retake' THEN 'Demo data: student is eligible for retake exam'
    ELSE 'Demo data: student should repeat the course'
  END AS note
FROM grades g
JOIN enrollments e ON e.id = g.enrollment_id
JOIN class_sections cs ON cs.id = e.class_section_id
WHERE g.status IN ('retake', 'repeat')
  AND cs.section_code IN (${generatedSectionCodes.map(sql).join(", ")});`,
);

const academicRows = [...academicAccumulator.entries()].map(([studentCode, item]) => {
  const average = Math.round((item.weightedScore / item.credits) * 100) / 100;
  return [
    { raw: `(SELECT id FROM students WHERE student_code = ${sql(studentCode)} LIMIT 1)` },
    {
      raw: `(SELECT id FROM semesters WHERE name = ${sql(item.semester.name)} AND academic_year = ${sql(
        item.semester.academicYear,
      )} LIMIT 1)`,
    },
    average,
    item.credits,
    classification(average),
  ];
});

lines.push(
  "",
  rawValuesInsert(
    "academic_records",
    ["student_id", "semester_id", "average_score", "total_credits", "classification"],
    academicRows,
    ["average_score", "total_credits", "classification"],
  ),
  "",
);

const outputPath = path.join(rootDir, "database/demo-data.sql");
await fs.writeFile(outputPath, `${lines.filter(Boolean).join("\n\n")}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      output: path.relative(rootDir, outputPath),
      students: students.length,
      courses: courses.length,
      semesters: semesters.length,
      classSections: classSections.length,
      enrollments: enrollmentRows.length,
      grades: gradeRows.length,
    },
    null,
    2,
  ),
);
