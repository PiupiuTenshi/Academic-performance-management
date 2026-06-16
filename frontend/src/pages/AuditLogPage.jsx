import React, { useState, useEffect } from "react";
import { getAuditLogs } from "../services/admin.api";
import Button from "../components/common/Button";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => { loadLogs(); }, [page, actionFilter]); // eslint-disable-line

  async function loadLogs() {
    setLoading(true);
    setLoadError("");
    try {
      const params = { page, limit: 20 };
      if (actionFilter.trim()) params.action = actionFilter.trim().toUpperCase();
      const data = await getAuditLogs(params);
      setLogs(data?.items || []);
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || err.message || "Không thể tải nhật ký.");
    } finally { setLoading(false); }
  }

  const ACTION_COLORS = {
    UPSERT_GRADE: "#dbeafe",
    UPDATE_GRADE: "#e0f2fe",
    LOCK_GRADES: "#fef9c3",
    CREATE_USER: "#d1fae5",
    LOCK_USER: "#fee2e2",
    UNLOCK_USER: "#dcfce7",
  };

  function formatDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleString("vi-VN");
  }

  function formatValue(val) {
    if (!val) return "—";
    try {
      const obj = typeof val === "string" ? JSON.parse(val) : val;
      return JSON.stringify(obj, null, 0).substring(0, 80);
    } catch {
      return String(val).substring(0, 80);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Nhật ký hệ thống</h1>

      {/* Filter */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group">
            <label className="form-label">Lọc theo hành động</label>
            <select className="form-control" style={{ minWidth: 220 }}
              value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">— Tất cả —</option>
              <option value="UPSERT_GRADE">UPSERT_GRADE</option>
              <option value="UPDATE_GRADE">UPDATE_GRADE</option>
              <option value="LOCK_GRADES">LOCK_GRADES</option>
              <option value="CREATE_USER">CREATE_USER</option>
              <option value="LOCK_USER">LOCK_USER</option>
              <option value="UNLOCK_USER">UNLOCK_USER</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tìm kiếm</label>
            <input
              type="text"
              className="form-control"
              style={{ minWidth: 260 }}
              placeholder="Username, Hành động, ID..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
            <Button variant="outline" onClick={() => { setPage(1); loadLogs(); }}>🔄 Tải lại</Button>
          </div>
        </div>
      </div>

      {/* Bảng log */}
      <div className="card">
        {loadError && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
            ⚠️ {loadError}
          </div>
        )}
        {loading ? <p className="loading-text">Đang tải nhật ký...</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>ID đối tượng</th>
                  <th>Giá trị mới</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = logs.filter((log) => {
                    const term = logSearch.trim().toLowerCase();
                    if (!term) return true;
                    return (
                      (log.actorUsername || "").toLowerCase().includes(term) ||
                      String(log.actorUserId).includes(term) ||
                      (log.action || "").toLowerCase().includes(term) ||
                      (log.entityType || "").toLowerCase().includes(term) ||
                      String(log.entityId).includes(term)
                    );
                  });
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                          Không có nhật ký nào.
                        </td>
                      </tr>
                    );
                  }
                  return filtered.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{log.id}</td>
                      <td><strong>{log.actorUsername || `#${log.actorUserId}`}</strong></td>
                      <td>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: ACTION_COLORS[log.action] || "#f1f5f9",
                          color: "#1e293b",
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.entityType}</td>
                      <td style={{ fontSize: 12 }}>{log.entityId}</td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatValue(log.newValue)}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        <div className="pagination">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Trước
          </Button>
          <span>Trang {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={logs.length < 20}>
            Sau →
          </Button>
        </div>
      </div>
    </div>
  );
}
