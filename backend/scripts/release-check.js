import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { env } from "../src/config/env.js";

const checks = [];

function runCommand(name, command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
      stdio: "pipe",
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      checks.push({
        name,
        passed: code === 0,
        code,
      });
      resolve({ code, output });
    });
  });
}

function addConfigCheck(name, passed, note, blocking = true) {
  checks.push({
    name,
    passed,
    note,
    blocking,
  });
}

async function listJavaScriptFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listJavaScriptFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(".js")) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat();
}

async function runSyntaxCheck() {
  const files = [...(await listJavaScriptFiles("src")), ...(await listJavaScriptFiles("scripts"))];

  for (const file of files) {
    const result = await runCommand(`Syntax check ${file}`, "node", ["--check", file]);

    if (result.code !== 0) {
      return;
    }
  }
}

await runSyntaxCheck();
await runCommand("Database check", "npm", ["run", "db:check"]);
await runCommand("Integration smoke test", "npm", ["run", "integration:smoke"]);
await runCommand("API regression test", "npm", ["run", "test:api"]);

addConfigCheck("DATABASE_URL or DB_* configured", Boolean(env.databaseUrl || env.db.host), "Backend needs database credentials");
addConfigCheck(
  "JWT_SECRET is not default",
  env.jwtSecret !== "change_me_in_local_env",
  "Use a long random secret before production deploy",
  false,
);
addConfigCheck("CORS origins configured", env.corsOrigins.length > 0, env.corsOrigins.join(", "));

const failed = checks.filter((check) => !check.passed && check.blocking !== false);
const warnings = checks.filter((check) => !check.passed && check.blocking === false);

console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      total: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      warnings: warnings.length,
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
