import { checkDatabaseConnection, pool, query } from "../src/config/database.js";

const expectedTables = [
  "users",
  "students",
  "lecturers",
  "courses",
  "semesters",
  "grade_rules",
  "grade_entry_periods",
  "class_sections",
  "enrollments",
  "grades",
  "retake_results",
  "academic_records",
  "audit_logs",
];

try {
  const info = await checkDatabaseConnection();
  const tableRows = await query("SHOW TABLES");
  const tableNames = tableRows.map((row) => Object.values(row)[0]);
  const missingTables = expectedTables.filter((table) => !tableNames.includes(table));

  console.log(
    JSON.stringify(
      {
        ok: true,
        database: info.databaseName,
        version: info.version,
        tableCount: tableNames.length,
        missingTables,
      },
      null,
      2,
    ),
  );

  process.exitCode = missingTables.length === 0 ? 0 : 2;
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        code: error.code,
        message: error.message,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

