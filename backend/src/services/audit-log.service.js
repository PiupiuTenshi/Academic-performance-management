import { query } from "../config/database.js";

export async function writeAuditLog({ actorUserId, action, entityType, entityId, oldValue, newValue }) {
  await query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      action,
      entityType,
      entityId,
      oldValue == null ? null : JSON.stringify(oldValue),
      newValue == null ? null : JSON.stringify(newValue),
    ],
  );
}

