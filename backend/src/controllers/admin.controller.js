import bcrypt from "bcryptjs";
import { pool, query } from "../config/database.js";
import { writeAuditLog } from "../services/audit-log.service.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/http-response.js";

const validRoles = ["student", "lecturer", "academic_staff", "admin"];

export async function getAuditLogs(req, res) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const offset = (page - 1) * limit;

  const rows = await query(
    `SELECT
       al.id,
       al.actor_user_id AS actorUserId,
       u.username AS actorUsername,
       al.action,
       al.entity_type AS entityType,
       al.entity_id AS entityId,
       al.old_value AS oldValue,
       al.new_value AS newValue,
       al.created_at AS createdAt
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE (? IS NULL OR al.actor_user_id = ?)
       AND (? IS NULL OR al.action = ?)
       AND (? IS NULL OR al.entity_type = ?)
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [
      req.query.actorId || null,
      req.query.actorId || null,
      req.query.action || null,
      req.query.action || null,
      req.query.entityType || null,
      req.query.entityType || null,
      limit,
      offset,
    ],
  );

  sendSuccess(res, {
    page,
    limit,
    items: rows,
  });
}

export async function createUser(req, res) {
  const { username, password, role, profile = {} } = req.body;

  if (!username || !password || !role) {
    throw new ApiError(400, "VALIDATION_ERROR", "username, password and role are required");
  }

  if (!validRoles.includes(role)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid role");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, passwordHash, role],
    );
    const userId = result.insertId;

    if (role === "student") {
      await connection.execute(
        "INSERT INTO students (user_id, student_code, full_name, email) VALUES (?, ?, ?, ?)",
        [userId, profile.studentCode, profile.fullName, profile.email || null],
      );
    }

    if (role === "lecturer") {
      await connection.execute(
        "INSERT INTO lecturers (user_id, lecturer_code, full_name, email) VALUES (?, ?, ?, ?)",
        [userId, profile.lecturerCode, profile.fullName, profile.email || null],
      );
    }

    await connection.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "CREATE_USER",
        "users",
        userId,
        null,
        JSON.stringify({ username, role }),
      ],
    );

    await connection.commit();

    sendSuccess(
      res,
      {
        id: userId,
        username,
        role,
      },
      "User created",
      201,
    );
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      throw new ApiError(409, "CONFLICT", "Username or profile code already exists");
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUserStatus(req, res) {
  const userId = Number(req.params.id);
  const { isActive } = req.body;

  if (!userId || typeof isActive !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "user id and isActive boolean are required");
  }

  const oldRows = await query("SELECT id, username, role, is_active FROM users WHERE id = ? LIMIT 1", [userId]);

  if (!oldRows[0]) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }

  await query("UPDATE users SET is_active = ? WHERE id = ?", [isActive, userId]);
  await writeAuditLog({
    actorUserId: req.user.id,
    action: isActive ? "UNLOCK_USER" : "LOCK_USER",
    entityType: "users",
    entityId: userId,
    oldValue: oldRows[0],
    newValue: { isActive },
  });

  sendSuccess(res, {
    id: userId,
    isActive,
  });
}

