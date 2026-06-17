import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getClasses, getSemesters } from "../services/grade.api";
import { getUsers, getAuditLogs } from "../services/admin.api";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) return;
    loadInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadInfo() {
    setLoading(true);
    setLoadError("");
    try {
      if (user.role === "lecturer") {
        const classes = await getClasses();
        setInfo({ classes });
      } else if (user.role === "academic_staff") {
        const semesters = await getSemesters();
        setInfo({ semesters });
      } else if (user.role === "admin") {
        const [usersData, logsData] = await Promise.all([
          getUsers({ limit: 1 }),
          getAuditLogs({ limit: 1 }),
        ]);
        // Backend trả { page, limit, items } — dùng items.length làm proxy
        // Không có tổng số nên hiển thị trang đầu
        setInfo({ usersData, logsData });
      }
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || err.message || "Không thể tải dữ liệu dashboard. Kiểm tra kết nối backend.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <h1 className="page-title">Tổng quan</h1>
      <p className="page-subtitle">Xin chào, <strong>{user.username}</strong>! Chào mừng bạn trở lại.</p>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {loadError}
        </div>
      )}

      {/* STUDENT */}
      {user.role === "student" && (
        <div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Vai trò</div>
              <div className="stat-value" style={{ fontSize: 20 }}>Sinh viên</div>
              <div className="stat-sub">Xem bảng điểm của bạn</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Hướng dẫn nhanh</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              • Chọn <strong>Bảng điểm</strong> ở sidebar để xem điểm các môn học.<br />
              • Lọc theo học kỳ để xem từng kỳ cụ thể.<br />
              • Trạng thái: <span style={{color:"#166534"}}>ĐẠT</span> / <span style={{color:"#854d0e"}}>THI LẠI</span> / <span style={{color:"#991b1b"}}>HỌC LẠI</span>.
            </p>
          </div>
        </div>
      )}

      {/* LECTURER */}
      {user.role === "lecturer" && (
        <div>
          <div className="card">
            <div className="card-title">📚 Lớp đang phụ trách</div>
            {loading ? (
              <p className="loading-text">Đang tải...</p>
            ) : !info?.classes?.length ? (
              <p className="empty-text">Bạn chưa được phân công lớp nào.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã lớp</th>
                      <th>Môn học</th>
                      <th>Học kỳ</th>
                      <th>Số SV</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.classes.map((c) => (
                      <tr key={c.id}>
                        <td>{c.sectionCode}</td>
                        <td>{c.courseName}</td>
                        <td>{c.semesterName}</td>
                        <td>{c.studentCount}</td>
                        <td>
                          {c.isGradeLocked
                            ? <span className="badge badge-passed">Đã khóa</span>
                            : <span className="badge badge-pending">Mở</span>}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/grades/input?semesterId=${c.semesterId}&classId=${c.id}`)}
                          >
                            Nhập điểm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACADEMIC STAFF */}
      {user.role === "academic_staff" && (
        <div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Học kỳ hiện có</div>
              <div className="stat-value">{loading ? "..." : (info?.semesters?.length ?? 0)}</div>
              <div className="stat-sub">Tổng số học kỳ</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">🎓 Chức năng chính</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              • <strong>Tính điểm tổng kết</strong>: Chọn lớp học phần → tính điểm.<br />
              • <strong>Xếp loại học lực</strong>: Chọn học kỳ → xếp loại toàn bộ sinh viên.<br />
              • <strong>Danh sách học lại/thi lại</strong>: Xem sinh viên cần xử lý.
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => navigate("/academic")}>
                Đến trang xử lý học vụ →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN */}
      {user.role === "admin" && (
        <div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Người dùng</div>
              <div className="stat-value">👥</div>
              <div className="stat-sub">Quản lý tài khoản</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Nhật ký</div>
              <div className="stat-value">📝</div>
              <div className="stat-sub">Xem lịch sử thao tác</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">⚙️ Chức năng Admin</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => navigate("/admin/users")}>
                Quản lý tài khoản
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/admin/audit-logs")}>
                Xem nhật ký
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/admin/system")}>
                Trạng thái hệ thống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
