import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const connectionConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || "academic_result_management",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    };

export const pool = mysql.createPool({
  ...(typeof connectionConfig === "string" ? { uri: connectionConfig } : connectionConfig),
  waitForConnections: true,
  connectionLimit: 10,
});
