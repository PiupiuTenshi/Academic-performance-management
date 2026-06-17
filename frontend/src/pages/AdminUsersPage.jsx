import React, { useState, useEffect } from "react";
import { getUsers, createUser, updateUserStatus } from "../services/admin.api";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";

const ROLES = ["student", "lecturer", "academic_staff", "admin"];
const ROLE_LABELS = {
  student: "Sinh viên", lecturer: "Giảng viên",
  academic_staff: "Giáo vụ", admin: "Admin",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Modal thêm user
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "student", fullName: "", studentCode: "", email: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => { loadUsers(); }, [page, filterRole]); // eslint-disable-line

  async function loadUsers() {
    setLoading(true);
    setLoadError("");
    try {
      const params = { page, limit: 20 };
      if (filterRole) params.role = filterRole;
      if (keyword.trim()) params.keyword = keyword.trim();
      const data = await getUsers(params);
      setUsers(data?.items || []);
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || err.message || "Không thể tải danh sách người dùng.");
    } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  async function handleToggleStatus(u) {
    try {
      await updateUserStatus(u.id, !u.isActive);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại.");
    }
  }

  async function handleAddUser() {
    if (!form.username || !form.password || !form.role) {
      setAddError("Username, mật khẩu và role là bắt buộc."); return;
    }
    setAdding(true); setAddError("");
    try {
      const profile = {};
      if (form.role === "student") {
        profile.studentCode = form.studentCode;
        profile.fullName = form.fullName;
        profile.email = form.email;
      } else if (form.role === "lecturer") {
        profile.lecturerCode = form.studentCode; // dùng lại field
        profile.fullName = form.fullName;
        profile.email = form.email;
      }
      await createUser({ username: form.username, password: form.password, role: form.role, profile });
      setShowAdd(false);
      setForm({ username: "", password: "", role: "student", fullName: "", studentCode: "", email: "" });
      loadUsers();
    } catch (err) {
      setAddError(err.response?.data?.message || "Tạo tài khoản thất bại.");
    } finally { setAdding(false); }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Quản lý tài khoản</h1>

      {/* Toolbar */}
      <div className="card">
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-group">
            <label className="form-label">Tìm kiếm</label>
            <input
              className="form-control" style={{ minWidth: 220 }}
              placeholder="Username, họ tên..."
              value={keyword} onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lọc theo role</label>
            <select className="form-control" style={{ minWidth: 160 }}
              value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}>
              <option value="">— Tất cả —</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Button variant="outline" type="submit">🔍 Tìm kiếm</Button>
            <Button variant="primary" type="button" onClick={() => setShowAdd(true)}>+ Thêm tài khoản</Button>
          </div>
        </form>
      </div>

      {/* Bảng user */}
      <div className="card">
        {loadError && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
            ⚠️ {loadError}
          </div>
        )}
        {loading ? <p className="loading-text">Đang tải...</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Không có dữ liệu.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.fullName || "—"}</td>
                    <td><span className={`role-badge ${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td>
                      {u.isActive
                        ? <span className="badge badge-passed">Hoạt động</span>
                        : <span className="badge badge-repeat">Đã khóa</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.isActive ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang đơn giản */}
        <div className="pagination">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Trước
          </Button>
          <span>Trang {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={users.length < 20}>
            Sau →
          </Button>
        </div>
      </div>

      {/* Modal thêm user */}
      <Modal
        isOpen={showAdd}
        title="Thêm tài khoản mới"
        onClose={() => { setShowAdd(false); setAddError(""); }}
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowAdd(false); setAddError(""); }}>Hủy</Button>
            <Button variant="primary" onClick={handleAddUser} disabled={adding}>
              {adding ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </>
        }
      >
        {addError && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
            {addError}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Username *</label>
          <input className="form-control" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
        </div>
        <div className="form-group">
          <label className="form-label">Mật khẩu *</label>
          <input className="form-control" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
        </div>
        <div className="form-group">
          <label className="form-label">Role *</label>
          <select className="form-control" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        {(form.role === "student" || form.role === "lecturer") && (
          <>
            <div className="form-group">
              <label className="form-label">Họ tên</label>
              <input className="form-control" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{form.role === "student" ? "Mã sinh viên" : "Mã giảng viên"}</label>
              <input className="form-control" value={form.studentCode}
                onChange={(e) => setForm({ ...form, studentCode: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
