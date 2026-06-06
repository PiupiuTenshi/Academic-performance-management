import app from "../src/app.js";
import { pool } from "../src/config/database.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();

  return {
    status: response.status,
    body: json,
  };
}

async function login(baseUrl, username) {
  const response = await request(baseUrl, "/auth/login", {
    method: "POST",
    body: {
      username,
      password: "123456",
    },
  });

  assert(response.status === 200, `${username} login should return 200`);
  assert(response.body.data?.accessToken, `${username} login should return token`);

  return response.body.data.accessToken;
}

const server = app.listen(0, async () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  try {
    const clientConfig = await request(baseUrl, "/client/config");
    assert(clientConfig.status === 200, "client config should return 200");

    const adminToken = await login(baseUrl, "admin");
    const studentToken = await login(baseUrl, "student01");
    const lecturerToken = await login(baseUrl, "lecturer01");

    const adminMe = await request(baseUrl, "/auth/me", { token: adminToken });
    assert(adminMe.body.data?.user?.role === "admin", "admin /auth/me should return admin role");

    const users = await request(baseUrl, "/admin/users", { token: adminToken });
    assert(users.status === 200, "admin should list users");

    const auditLogs = await request(baseUrl, "/admin/audit-logs", { token: adminToken });
    assert(auditLogs.status === 200, "admin should list audit logs");

    const lecturerClasses = await request(baseUrl, "/classes", { token: lecturerToken });
    assert(lecturerClasses.status === 200, "lecturer should list assigned classes");

    const forbiddenGradeInput = await request(baseUrl, "/grades/bulk", {
      token: studentToken,
      method: "POST",
      body: {
        classSectionId: 1,
        grades: [],
      },
    });
    assert(forbiddenGradeInput.status === 403, "student should not access grade input API");

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            "client config",
            "admin login",
            "student login",
            "lecturer login",
            "auth me",
            "admin users",
            "admin audit logs",
            "lecturer classes",
            "student forbidden grade input",
          ],
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: error.message,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
});

