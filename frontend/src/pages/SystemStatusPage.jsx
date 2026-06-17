import React, { useEffect, useState } from "react";
import Button from "../components/common/Button";
import { getClientConfig, getDatabaseHealth, getHealth } from "../services/system.api";

function StatusBadge({ ok }) {
  return (
    <span className={`badge ${ok ? "badge-passed" : "badge-repeat"}`}>
      {ok ? "OK" : "Lỗi"}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <strong style={{ textAlign: "right", wordBreak: "break-word" }}>{value ?? "-"}</strong>
    </div>
  );
}

export default function SystemStatusPage() {
  const [health, setHealth] = useState(null);
  const [database, setDatabase] = useState(null);
  const [config, setConfig] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    setLoading(true);
    setErrors({});

    const nextErrors = {};

    const [healthResult, databaseResult, configResult] = await Promise.allSettled([
      getHealth(),
      getDatabaseHealth(),
      getClientConfig(),
    ]);

    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    else nextErrors.health = healthResult.reason?.response?.data?.error?.message || healthResult.reason?.message;

    if (databaseResult.status === "fulfilled") setDatabase(databaseResult.value);
    else nextErrors.database = databaseResult.reason?.response?.data?.error?.message || databaseResult.reason?.message;

    if (configResult.status === "fulfilled") setConfig(configResult.value);
    else nextErrors.config = configResult.reason?.response?.data?.error?.message || configResult.reason?.message;

    setErrors(nextErrors);
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Trạng thái hệ thống</h1>
        <Button variant="outline" onClick={loadStatus} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </Button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">API</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            <StatusBadge ok={Boolean(health && !errors.health)} />
          </div>
          <div className="stat-sub">{errors.health || health?.service || "Đang kiểm tra"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cơ sở dữ liệu</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            <StatusBadge ok={Boolean(database && !errors.database)} />
          </div>
          <div className="stat-sub">{errors.database || database?.database || "Đang kiểm tra"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cấu hình client</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            <StatusBadge ok={Boolean(config && !errors.config)} />
          </div>
          <div className="stat-sub">{errors.config || config?.apiBaseUrl || "Đang kiểm tra"}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Kiểm tra API</div>
        <InfoRow label="Trạng thái" value={health?.status} />
        <InfoRow label="Dịch vụ" value={health?.service} />
      </div>

      <div className="card">
        <div className="card-title">Kiểm tra cơ sở dữ liệu</div>
        <InfoRow label="Trạng thái" value={database?.status} />
        <InfoRow label="Cơ sở dữ liệu" value={database?.database} />
        <InfoRow label="Phiên bản" value={database?.version} />
        <InfoRow label="Thời gian máy chủ" value={database?.serverTime ? new Date(database.serverTime).toLocaleString("vi-VN") : "-"} />
      </div>

      <div className="card">
        <div className="card-title">Cấu hình client</div>
        <InfoRow label="API base URL" value={config?.apiBaseUrl} />
        <InfoRow label="Swagger URL" value={config?.swaggerUrl} />
        <InfoRow label="Khóa token" value={config?.tokenStorageKey} />
        <InfoRow label="Vai trò" value={config?.roles?.join(", ")} />
        <InfoRow label="Nguồn CORS" value={config?.corsOrigins?.join(", ")} />
      </div>
    </div>
  );
}
