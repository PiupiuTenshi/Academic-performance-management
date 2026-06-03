import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileArg = process.argv[2];

if (!fileArg) {
  console.error("Usage: node scripts/run-sql-file.js <relative-sql-file>");
  process.exit(1);
}

const sqlPath = path.resolve(__dirname, "../../", fileArg);
const sql = await fs.readFile(sqlPath, "utf8");
const statements = sql
  .split(/;\s*$/m)
  .map((statement) => statement.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log(
    JSON.stringify({
      ok: true,
      file: fileArg,
      statements: statements.length,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      ok: false,
      file: fileArg,
      code: error.code,
      message: error.message,
    }),
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

