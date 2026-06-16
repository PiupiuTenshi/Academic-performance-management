import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getTranscript } from "../services/student.api";
import { getSemesters } from "../services/grade.api";
import { formatScore } from "../utils/formatScore";
import GradeStatusBadge from "../components/grades/GradeStatusBadge";
import Modal from "../components/common/Modal";
import { logout as logoutApi } from "../services/auth.api";
import logoImg from "../assets/logo.png";
import "./StudentTranscriptPage.css";

export default function StudentTranscriptPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchCode, setSearchCode] = useState("");
  const [activeSearchCode, setActiveSearchCode] = useState("");
  const [selectedItem, setSelectedItem] = useState(null); // For detail modal

  // Fetch semesters list on page mount
  useEffect(() => {
    getSemesters()
      .then(setSemesters)
      .catch(() => {});
  }, []);

  // Auto load own transcript if user is student
  useEffect(() => {
    if (!user) return;
    if (user.role === "student") {
      setActiveSearchCode(user.id);
    }
  }, [user]);

  // Fetch transcript when activeSearchCode changes
  useEffect(() => {
    if (!activeSearchCode) return;
    fetchTranscriptData(activeSearchCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearchCode]);

  async function fetchTranscriptData(identifier) {
    setLoading(true);
    setError("");
    try {
      const data = await getTranscript(identifier);
      setTranscript(data);
      if (data?.student?.studentCode) {
        setSearchCode(data.student.studentCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải bảng điểm. Vui lòng kiểm tra lại mã sinh viên.");
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch (_) {
      // ignore
    }
    logout();
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchCode.trim()) {
      setError("Vui lòng nhập mã sinh viên.");
      return;
    }
    setActiveSearchCode(searchCode.trim());
  }

  // Convert scale 10 to scale 4
  function getScale4(score) {
    if (score === null || score === undefined) return "—";
    const s = Number(score);
    if (isNaN(s)) return "—";
    if (s >= 9.0) return "4.0";
    if (s >= 8.5) return "3.7";
    if (s >= 8.0) return "3.5";
    if (s >= 7.0) return "3.0";
    if (s >= 6.5) return "2.5";
    if (s >= 5.5) return "2.0";
    if (s >= 5.0) return "1.5";
    if (s >= 4.0) return "1.0";
    return "0.0";
  }

  // Convert scale 10 to letter grade
  function getLetterGrade(score) {
    if (score === null || score === undefined) return "—";
    const s = Number(score);
    if (isNaN(s)) return "—";
    if (s >= 9.0) return "A+";
    if (s >= 8.5) return "A";
    if (s >= 8.0) return "B+";
    if (s >= 7.0) return "B";
    if (s >= 6.5) return "C+";
    if (s >= 5.5) return "C";
    if (s >= 5.0) return "D+";
    if (s >= 4.0) return "D";
    return "F";
  }

  // Filter items by selected semester at client side (to allow cumulative calculations)
  const filteredItems = transcript?.items
    ? transcript.items.filter((item) => !semesterId || Number(item.semesterId) === Number(semesterId))
    : [];

  // Compute GPA and statistics
  const calcStats = () => {
    if (!transcript?.items || transcript.items.length === 0) {
      return {
        semesterGpa10: "—",
        semesterGpa4: "—",
        cumulativeGpa10: "—",
        cumulativeGpa4: "—",
        cumulativeCredits: 0,
        classification: "—"
      };
    }

    const items = transcript.items;

    // 1. Cumulative Statistics
    const gradedItems = items.filter(
      (item) => item.totalScore !== null && item.totalScore !== undefined && !isNaN(Number(item.totalScore))
    );

    let cumulativeGpa10 = "—";
    let cumulativeGpa4 = "—";
    let cumulativeCredits = 0;
    let classification = "—";

    if (gradedItems.length > 0) {
      const sumScore10 = gradedItems.reduce((acc, item) => acc + Number(item.totalScore) * Number(item.credits), 0);
      const sumCreditsGraded = gradedItems.reduce((acc, item) => acc + Number(item.credits), 0);
      const gpa10 = sumCreditsGraded > 0 ? sumScore10 / sumCreditsGraded : 0;
      cumulativeGpa10 = gpa10.toFixed(2);

      const sumScore4 = gradedItems.reduce((acc, item) => {
        const val4 = parseFloat(getScale4(item.totalScore));
        return acc + val4 * Number(item.credits);
      }, 0);
      const gpa4 = sumCreditsGraded > 0 ? sumScore4 / sumCreditsGraded : 0;
      cumulativeGpa4 = gpa4.toFixed(2);

      // Cumulative passed credits
      const passedItems = items.filter(
        (item) => item.status === "passed" || (item.totalScore !== null && Number(item.totalScore) >= 4.0)
      );
      cumulativeCredits = passedItems.reduce((acc, item) => acc + Number(item.credits), 0);

      // Classification based on cumulative GPA (scale 4)
      if (gpa4 >= 3.6) classification = "Xuất sắc";
      else if (gpa4 >= 3.2) classification = "Giỏi";
      else if (gpa4 >= 2.5) classification = "Khá";
      else if (gpa4 >= 2.0) classification = "Trung bình";
      else classification = "Yếu";
    }

    // 2. Selected Semester Statistics
    let semesterGpa10 = "—";
    let semesterGpa4 = "—";

    if (semesterId) {
      const semesterGraded = gradedItems.filter((item) => Number(item.semesterId) === Number(semesterId));
      if (semesterGraded.length > 0) {
        const sumSemScore10 = semesterGraded.reduce((acc, item) => acc + Number(item.totalScore) * Number(item.credits), 0);
        const sumSemCredits = semesterGraded.reduce((acc, item) => acc + Number(item.credits), 0);
        semesterGpa10 = sumSemCredits > 0 ? (sumSemScore10 / sumSemCredits).toFixed(2) : "—";

        const sumSemScore4 = semesterGraded.reduce((acc, item) => {
          const val4 = parseFloat(getScale4(item.totalScore));
          return acc + val4 * Number(item.credits);
        }, 0);
        semesterGpa4 = sumSemCredits > 0 ? (sumSemScore4 / sumSemCredits).toFixed(2) : "—";
      }
    }

    return {
      semesterGpa10,
      semesterGpa4,
      cumulativeGpa10,
      cumulativeGpa4,
      cumulativeCredits,
      classification
    };
  };

  const stats = calcStats();

  // Extract class group suffix from sectionCode (e.g. CS101-01 -> 01)
  function getGroupSuffix(sectionCode) {
    if (!sectionCode) return "—";
    if (sectionCode.includes("-")) {
      return sectionCode.split("-").pop();
    }
    return sectionCode;
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="transcript-layout">
      {/* Redesigned Mockup Header */}
      <header className="transcript-header">
        <div className="transcript-logo-container">
          <img src={logoImg} alt="PTIT Logo" />
        </div>
        <h1 className="transcript-system-title">HỆ THỐNG QUẢN LÝ KẾT QUẢ HỌC TẬP</h1>
        <div className="transcript-header-actions">
          {user && user.role !== "student" && (
            <button className="transcript-btn-back" onClick={() => navigate("/dashboard")}>
              ← Quay lại Dashboard
            </button>
          )}
          <button className="transcript-btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="transcript-container">
        {/* Title and Search Bar Row */}
        <div className="transcript-search-row">
          <h2>Tra cứu điểm</h2>
          {user?.role !== "student" && (
            <form className="transcript-search-box" onSubmit={handleSearch}>
              <input
                type="text"
                className="transcript-search-input"
                placeholder="Nhập mã sinh viên"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              <button type="submit" className="transcript-btn-search">
                Tìm kiếm
              </button>
            </form>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="card" style={{ borderLeft: "4px solid var(--danger)", padding: "12px 20px", color: "var(--danger)", fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Student Information Card */}
        {transcript?.student ? (
          <div className="transcript-info-card">
            <div className="transcript-info-title">Thông tin sinh viên</div>
            <div className="transcript-info-grid">
              <div className="transcript-info-item">
                Họ và tên: <strong>{transcript.student.fullName}</strong>
              </div>
              <div className="transcript-info-item">
                Mã SV: <strong>{transcript.student.studentCode}</strong>
              </div>
            </div>

            <div className="transcript-info-actions">
              <div className="transcript-select-semester">
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)" }}>Chọn học kỳ:</span>
                <select
                  className="transcript-select-control"
                  style={{ minWidth: 220 }}
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                >
                  <option value="">— Tất cả học kỳ —</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <button className="transcript-btn-export" onClick={handlePrint}>
                🖨️ Xuất bảng điểm
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: 48 }}>
              {user?.role === "student"
                ? "Không tìm thấy thông tin sinh viên của tài khoản này."
                : "Vui lòng nhập mã sinh viên và nhấn nút Tìm kiếm để tra cứu điểm."}
            </div>
          )
        )}

        {/* Loading Spinner */}
        {loading && <p className="loading-text">Đang tải bảng điểm...</p>}

        {/* Transcript Table */}
        {!loading && transcript?.student && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrapper">
              <table className="transcript-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: "center" }}>STT</th>
                    <th>Mã môn</th>
                    <th>Tên môn</th>
                    <th style={{ textAlign: "center" }}>Nhóm</th>
                    <th style={{ textAlign: "center" }}>Điểm thi</th>
                    <th style={{ textAlign: "center" }}>Điểm TK(10)</th>
                    <th style={{ textAlign: "center" }}>Điểm TK(4)</th>
                    <th style={{ textAlign: "center" }}>Điểm TK(C)</th>
                    <th style={{ textAlign: "center" }}>KQ</th>
                    <th style={{ textAlign: "center" }} className="print-hidden">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        Chưa có dữ liệu điểm học phần cho học kỳ này.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center", fontWeight: 500 }}>{idx + 1}</td>
                        <td>{item.courseCode}</td>
                        <td style={{ fontWeight: 500 }}>{item.courseName}</td>
                        <td style={{ textAlign: "center" }}>{getGroupSuffix(item.sectionCode)}</td>
                        <td style={{ textAlign: "center" }}>{formatScore(item.finalScore)}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{formatScore(item.totalScore)}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{getScale4(item.totalScore)}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{getLetterGrade(item.totalScore)}</td>
                        <td style={{ textAlign: "center" }}>
                          <GradeStatusBadge status={item.status} />
                        </td>
                        <td style={{ textAlign: "center" }} className="print-hidden">
                          <button
                            className="transcript-btn-detail"
                            onClick={() => setSelectedItem(item)}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {!loading && transcript?.student && (
          <div className="transcript-stats-box">
            <div className="transcript-stats-grid">
              <div className="transcript-stat-card stat-gpa-10">
                <div className="stat-label">Điểm TB học kỳ (10)</div>
                <div className="stat-val">{stats.semesterGpa10}</div>
              </div>
              <div className="transcript-stat-card stat-gpa-4">
                <div className="stat-label">Điểm TB tích lũy (4)</div>
                <div className="stat-val">{stats.cumulativeGpa4}</div>
              </div>
              <div className="transcript-stat-card stat-credits">
                <div className="stat-label">Số tín chỉ tích lũy</div>
                <div className="stat-val">{stats.cumulativeCredits}</div>
              </div>
              <div className="transcript-stat-card stat-class">
                <div className="stat-label">Xếp loại học lực</div>
                <div className="stat-val" style={{ color: "var(--primary-dark)" }}>{stats.classification}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Scores Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          title={`Chi tiết điểm môn: ${selectedItem.courseName}`}
          onClose={() => setSelectedItem(null)}
        >
          <div className="score-details-list">
            <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1.5px solid #cbd5e1" }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Mã học phần: </span>
              <strong style={{ fontSize: 14 }}>{selectedItem.courseCode}</strong>
              <span style={{ margin: "0 10px", color: "#cbd5e1" }}>|</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Số tín chỉ: </span>
              <strong style={{ fontSize: 14 }}>{selectedItem.credits}</strong>
            </div>

            <div className="score-details-item">
              <span className="score-name">Điểm chuyên cần</span>
              <div className="score-val-container">
                <span className="score-weight-badge">
                  {selectedItem.attendanceWeight !== null ? `${selectedItem.attendanceWeight * 100}%` : "10%"}
                </span>
                <span className="score-number">{formatScore(selectedItem.attendanceScore)}</span>
              </div>
            </div>

            <div className="score-details-item">
              <span className="score-name">Điểm bài tập</span>
              <div className="score-val-container">
                <span className="score-weight-badge">
                  {selectedItem.assignmentWeight !== null ? `${selectedItem.assignmentWeight * 100}%` : "20%"}
                </span>
                <span className="score-number">{formatScore(selectedItem.assignmentScore)}</span>
              </div>
            </div>

            <div className="score-details-item">
              <span className="score-name">Điểm thi giữa kỳ</span>
              <div className="score-val-container">
                <span className="score-weight-badge">
                  {selectedItem.midtermWeight !== null ? `${selectedItem.midtermWeight * 100}%` : "20%"}
                </span>
                <span className="score-number">{formatScore(selectedItem.midtermScore)}</span>
              </div>
            </div>

            <div className="score-details-item">
              <span className="score-name">Điểm thi cuối kỳ</span>
              <div className="score-val-container">
                <span className="score-weight-badge">
                  {selectedItem.finalWeight !== null ? `${selectedItem.finalWeight * 100}%` : "50%"}
                </span>
                <span className="score-number">{formatScore(selectedItem.finalScore)}</span>
              </div>
            </div>

            <div className="score-details-item" style={{ marginTop: 12, paddingTop: 12, borderTop: "2px dashed #e2e8f0" }}>
              <strong className="score-name" style={{ fontSize: 15, color: "var(--text)" }}>Tổng kết</strong>
              <div className="score-val-container">
                <span className="badge badge-passed" style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px" }}>
                  {getLetterGrade(selectedItem.totalScore)}
                </span>
                <strong className="score-number" style={{ fontSize: 18, color: "var(--primary-dark)" }}>
                  {formatScore(selectedItem.totalScore)}
                </strong>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
