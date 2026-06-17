import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABELS } from "../../utils/roleMenu";
import { logout as logoutApi } from "../../services/auth.api";

export default function Header({ pageTitle }) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    try { await logoutApi(); } catch (_) { /* bỏ qua lỗi */ }
    logout();
  }

  return (
    <header className="header">
      <span className="header-title">{pageTitle || "Quản lý kết quả học tập"}</span>
      <div className="header-right">
        {user && (
          <>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Xin chào, <strong>{user.username}</strong>
            </span>
            <span className={`role-badge ${user.role}`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
