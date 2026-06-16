import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "change_me_in_local_env",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  databaseUrl: process.env.DATABASE_URL,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || "academic_result_management",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  },
};
