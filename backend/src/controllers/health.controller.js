import { checkDatabaseConnection } from "../config/database.js";

export function getHealth(_req, res) {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "academic-performance-management-api",
    },
    status: "ok",
    service: "academic-performance-management-api",
  });
}

export async function getDatabaseHealth(_req, res, next) {
  try {
    const info = await checkDatabaseConnection();

    res.json({
      success: true,
      data: {
        status: "ok",
        database: info.databaseName,
        version: info.version,
        serverTime: info.serverTime,
      },
      status: "ok",
      database: info.databaseName,
      version: info.version,
      serverTime: info.serverTime,
    });
  } catch (error) {
    next(error);
  }
}
