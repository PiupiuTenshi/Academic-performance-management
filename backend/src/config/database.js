import mysql from "mysql2/promise";
import { env } from "./env.js";

const connectionConfig = env.databaseUrl
  ? env.databaseUrl
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    };

export const pool = mysql.createPool({
  ...(typeof connectionConfig === "string" ? { uri: connectionConfig } : connectionConfig),
  waitForConnections: true,
  connectionLimit: 10,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function checkDatabaseConnection() {
  const rows = await query("SELECT DATABASE() AS databaseName, VERSION() AS version, NOW() AS serverTime");
  return rows[0];
}
