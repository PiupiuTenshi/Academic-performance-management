import jwt from "jsonwebtoken";
import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { pool, query } from "../src/config/database.js";

const results = [];

function record(name, passed, details = {}) {
  results.push({
    name,
    passed,
    ...details,
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function test(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (error) {
    record(name, false, {
      error: error.message,
    });
  }
}

async function login(baseUrl, username, password = "123456") {
  const response = await request(baseUrl, "/auth/login", {
    method: "POST",
    body: {
      username,
      password,
    },
  });

  assert(response.status === 200, `${username} login expected 200, got ${response.status}`);
  assert(response.body.data?.accessToken, `${username} login did not return accessToken`);

  return response.body.data;
}

const server = app.listen(0, async () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  const context = {};

  try {
    await test("Health API returns 200", async () => {
      const response = await request(baseUrl, "/health");
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(response.body.success === true || response.body.status === "ok", "health response is not ok");
    });

    await test("Database health API returns 200", async () => {
      const response = await request(baseUrl, "/health/database");
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(response.body.data?.database || response.body.database, "database name missing");
    });

    await test("Client config API returns integration settings", async () => {
      const response = await request(baseUrl, "/client/config");
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(response.body.data?.tokenStorageKey === "apm_access_token", "token storage key mismatch");
    });

    await test("Login rejects wrong password", async () => {
      const response = await request(baseUrl, "/auth/login", {
        method: "POST",
        body: {
          username: "admin",
          password: "wrong-password",
        },
      });
      assert(response.status === 401, `expected 401, got ${response.status}`);
    });

    await test("Seed users can login", async () => {
      context.admin = await login(baseUrl, "admin");
      context.academic = await login(baseUrl, "academic01");
      context.lecturer = await login(baseUrl, "lecturer01");
      context.student = await login(baseUrl, "student01");
      assert(context.admin.user.role === "admin", "admin role mismatch");
      assert(context.academic.user.role === "academic_staff", "academic role mismatch");
      assert(context.lecturer.user.role === "lecturer", "lecturer role mismatch");
      assert(context.student.user.role === "student", "student role mismatch");
    });

    await test("Missing token is rejected", async () => {
      const response = await request(baseUrl, "/auth/me");
      assert(response.status === 401, `expected 401, got ${response.status}`);
      assert(response.body.error?.code === "UNAUTHENTICATED", "expected UNAUTHENTICATED");
    });

    await test("Expired token is rejected", async () => {
      const expiredToken = jwt.sign(
        {
          sub: context.admin.user.id,
          role: "admin",
          username: "admin",
        },
        env.jwtSecret,
        { expiresIn: "-1s" },
      );
      const response = await request(baseUrl, "/auth/me", { token: expiredToken });
      assert(response.status === 401, `expected 401, got ${response.status}`);
    });

    await test("Admin can list users and audit logs", async () => {
      const users = await request(baseUrl, "/admin/users", { token: context.admin.accessToken });
      const logs = await request(baseUrl, "/admin/audit-logs", { token: context.admin.accessToken });
      assert(users.status === 200, `users expected 200, got ${users.status}`);
      assert(logs.status === 200, `audit logs expected 200, got ${logs.status}`);
      assert(users.body.data?.items?.length >= 4, "expected seeded users");
    });

    await test("Lecturer cannot list admin users", async () => {
      const response = await request(baseUrl, "/admin/users", { token: context.lecturer.accessToken });
      assert(response.status === 403, `expected 403, got ${response.status}`);
    });

    await test("Student cannot call grade input API", async () => {
      const response = await request(baseUrl, "/grades/bulk", {
        token: context.student.accessToken,
        method: "POST",
        body: {
          classSectionId: 1,
          grades: [],
        },
      });
      assert(response.status === 403, `expected 403, got ${response.status}`);
    });

    await test("Lecturer can list assigned classes and students", async () => {
      const classes = await request(baseUrl, "/classes", { token: context.lecturer.accessToken });
      assert(classes.status === 200, `classes expected 200, got ${classes.status}`);
      assert(classes.body.data?.length >= 1, "expected at least one class");

      context.classSectionId = classes.body.data[0].id;
      const classStudents = await request(baseUrl, `/classes/${context.classSectionId}/students`, {
        token: context.lecturer.accessToken,
      });
      assert(classStudents.status === 200, `class students expected 200, got ${classStudents.status}`);
      assert(classStudents.body.data?.students?.length >= 1, "expected at least one class student");

      context.enrollmentId = classStudents.body.data.students[0].enrollmentId;
      context.studentId = classStudents.body.data.students[0].studentId;
    });

    await test("Bulk grade rejects invalid row and accepts valid row", async () => {
      const invalid = await request(baseUrl, "/grades/bulk", {
        token: context.lecturer.accessToken,
        method: "POST",
        body: {
          classSectionId: context.classSectionId,
          grades: [
            {
              enrollmentId: context.enrollmentId,
              attendanceScore: 11,
              assignmentScore: 7,
              midtermScore: 6,
              finalScore: 8,
            },
          ],
        },
      });
      assert(invalid.status === 200, `invalid bulk expected 200 partial result, got ${invalid.status}`);
      assert(invalid.body.data?.failedCount === 1, "invalid row should fail");

      const valid = await request(baseUrl, "/grades/bulk", {
        token: context.lecturer.accessToken,
        method: "POST",
        body: {
          classSectionId: context.classSectionId,
          grades: [
            {
              enrollmentId: context.enrollmentId,
              attendanceScore: 8,
              assignmentScore: 7,
              midtermScore: 6,
              finalScore: 9,
            },
          ],
        },
      });
      assert(valid.status === 200, `valid bulk expected 200, got ${valid.status}`);
      assert(valid.body.data?.savedCount === 1, "valid row should save");
    });

    await test("Student can view own transcript", async () => {
      const studentRows = await query("SELECT id FROM students WHERE user_id = ? LIMIT 1", [
        context.student.user.id,
      ]);
      assert(studentRows[0]?.id, "student profile for student01 is missing");

      const response = await request(baseUrl, `/students/${studentRows[0].id}/transcript`, {
        token: context.student.accessToken,
      });
      assert(response.status === 200, `expected 200, got ${response.status}`);
      assert(response.body.data?.items?.length >= 1, "expected transcript items");
    });

    await test("Academic calculation requires locked grade sheet", async () => {
      const response = await request(baseUrl, "/academic/calculate-final", {
        token: context.academic.accessToken,
        method: "POST",
        body: {
          classSectionId: context.classSectionId,
        },
      });
      assert(response.status === 409, `expected 409, got ${response.status}`);
    });
  } finally {
    const failed = results.filter((result) => !result.passed);

    console.log(
      JSON.stringify(
        {
          ok: failed.length === 0,
          total: results.length,
          passed: results.length - failed.length,
          failed: failed.length,
          results,
        },
        null,
        2,
      ),
    );

    server.close();
    await pool.end();

    if (failed.length > 0) {
      process.exitCode = 1;
    }
  }
});
