import React, { useState, useEffect } from "react";
import {
  getSemesters, getClasses, calculateFinal,
  classifySemester, getRetakes,
} from "../services/grade.api";
import Button from "../components/common/Button";
import GradeStatusBadge from "../components/grades/GradeStatusBadge";
import { formatScore } from "../utils/formatScore";

function getScale4(score) {
  if (score === null || score === undefined || isNaN(Number(score))) return "—";
  const s = Number(score);
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

export default function AcademicProcessingPage() {
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);

  // Tab 1: Tính điểm tổng kết
  const [calcSemester, setCalcSemester] = useState("");
  const [calcClass, setCalcClass] = useState("");
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState("");

  // Tab 2: Xếp loại học lực
  const [classifySem, setClassifySem] = useState("");
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyError, setClassifyError] = useState("");

  // Tab 3: Học lại / thi lại
  const [retakeSem, setRetakeSem] = useState("");
  const [retakes, setRetakes] = useState([]);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeError, setRetakeError] = useState("");
  const [retakeSearch, setRetakeSearch] = useState("");

  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    getSemesters()
      .then(setSemesters)
      .catch(() => setRetakeError("Không thể tải danh sách học kỳ. Kiểm tra kết nối backend."));
  }, []);

  useEffect(() => {
    if (!calcSemester) { setClasses([]); setCalcClass(""); return; }
    getClasses(calcSemester).then(setClasses).catch(() => {});
  }, [calcSemester]);

  async function handleCalculate() {
    if (!calcClass) { setCalcError("Vui lòng chọn lớp học phần."); return; }
    setCalcLoading(true); setCalcError(""); setCalcResult(null);
    try {
      const result = await calculateFinal(Number(calcClass));
      setCalcResult(result);
    } catch (err) {
      setCalcError(err.response?.data?.message || "Tính điểm thất bại.");
    } finally { setCalcLoading(false); }
  }

  async function handleClassify() {
    if (!classifySem) { setClassifyError("Vui lòng chọn học kỳ."); return; }
    setClassifyLoading(true); setClassifyError(""); setClassifyResult(null);
    try {
      const result = await classifySemester(Number(classifySem));
      setClassifyResult(result);
    } catch (err) {
      setClassifyError(err.response?.data?.message || "Xếp loại thất bại.");
    } finally { setClassifyLoading(false); }
  }

  async function handleLoadRetakes() {
    setRetakeLoading(true); setRetakeError("");
    try {
      const params = retakeSem ? { semesterId: retakeSem } : {};
      const data = await getRetakes(params);
      setRetakes(data || []);
    } catch (err) {
      setRetakeError(err.response?.data?.error?.message || err.message || "Không tải được dữ liệu học lại / thi lại. Kiểm tra kết nối backend.");
    } finally { setRetakeLoading(false); }
  }

  // Load retakes ban đầu
  useEffect(() => { handleLoadRetakes(); }, []); // eslint-disable-line

  const TAB_STYLE = (t) => ({
    padding: "9px 20px", border: "none", borderRadius: "var(--radius) var(--radius) 0 0",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
    background: activeTab === t ? "var(--white)" : "#f1f5f9",
    borderBottom: activeTab === t ? "2px solid var(--primary)" : "2px solid transparent",
    color: activeTab === t ? "var(--primary)" : "var(--text-muted)",
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Xử lý học vụ</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        <button style={TAB_STYLE(1)} onClick={() => setActiveTab(1)}>1. Tính điểm tổng kết</button>
        <button style={TAB_STYLE(2)} onClick={() => setActiveTab(2)}>2. Xếp loại học lực</button>
        <button style={TAB_STYLE(3)} onClick={() => setActiveTab(3)}>3. Học lại / Thi lại</button>
      </div>

      {/* Tab 1: Tính điểm */}
      {activeTab === 1 && (
        <div className="card">
          <div className="card-title">Tính điểm tổng kết lớp học phần</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Yêu cầu: Bảng điểm phải được khóa trước khi tính điểm tổng kết.
          </p>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }}
                value={calcSemester} onChange={(e) => { setCalcSemester(e.target.value); setCalcClass(""); }}>
                <option value="">— Chọn học kỳ —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>
            {classes.length > 0 && (
              <div className="form-group">
                <label className="form-label">Lớp học phần</label>
                <select className="form-control" style={{ minWidth: 220 }}
                  value={calcClass} onChange={(e) => setCalcClass(e.target.value)}>
                  <option value="">— Chọn lớp —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.sectionCode} – {c.courseName}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="primary" onClick={handleCalculate} disabled={calcLoading || !calcClass}>
                {calcLoading ? "Đang tính..." : "⚙️ Tính điểm"}
              </Button>
            </div>
          </div>
          {calcError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{calcError}</p>}
          {calcResult && (
            <div style={{ background: "#dcfce7", borderRadius: "var(--radius)", padding: "12px 16px", marginTop: 12 }}>
              <strong style={{ color: "#166534" }}>✅ Tính điểm thành công!</strong>
              <p style={{ color: "#166534", fontSize: 13, marginTop: 4 }}>
                Đã tính điểm cho <strong>{calcResult.calculatedCount}</strong> sinh viên.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Xếp loại */}
      {activeTab === 2 && (
        <div className="card">
          <div className="card-title">Xếp loại học lực theo học kỳ</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Xếp loại: Giỏi (≥8.0) · Khá (≥6.5) · Trung bình (≥5.0) · Yếu (&lt;5.0)
          </p>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Chọn học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }}
                value={classifySem} onChange={(e) => setClassifySem(e.target.value)}>
                <option value="">— Chọn học kỳ —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="success" onClick={handleClassify} disabled={classifyLoading || !classifySem}>
                {classifyLoading ? "Đang xếp loại..." : "🎓 Xếp loại"}
              </Button>
            </div>
          </div>
          {classifyError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{classifyError}</p>}
          {classifyResult && (
            <div style={{ background: "#dcfce7", borderRadius: "var(--radius)", padding: "12px 16px", marginTop: 12 }}>
              <strong style={{ color: "#166534" }}>✅ Xếp loại thành công!</strong>
              <p style={{ color: "#166534", fontSize: 13, marginTop: 4 }}>
                Đã xếp loại cho <strong>{classifyResult.classifiedCount}</strong> sinh viên.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Học lại / thi lại */}
      {activeTab === 3 && (
        <div className="card">
          <div className="card-title">Danh sách học lại / thi lại</div>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Lọc học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }}
                value={retakeSem} onChange={(e) => setRetakeSem(e.target.value)}>
                <option value="">— Tất cả —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tìm kiếm sinh viên</label>
              <input
                type="text"
                className="form-control"
                style={{ minWidth: 260 }}
                placeholder="Nhập Mã SV hoặc Họ tên..."
                value={retakeSearch}
                onChange={(e) => setRetakeSearch(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="outline" onClick={handleLoadRetakes} disabled={retakeLoading}>
                🔄 Tải lại
              </Button>
            </div>
          </div>
          {retakeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{retakeError}</p>}
          {retakeLoading ? (
            <p className="loading-text">Đang tải...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã SV</th>
                    <th>Họ tên</th>
                    <th>Mã môn</th>
                    <th>Tên môn</th>
                    <th>Điểm TK (10)</th>
                    <th>Điểm TK (4)</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = retakes.filter((r) => {
                      const term = retakeSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (
                        r.studentCode.toLowerCase().includes(term) ||
                        r.fullName.toLowerCase().includes(term)
                      );
                    });
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                            Không có sinh viên học lại / thi lại.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.studentCode}</td>
                        <td>{r.fullName}</td>
                        <td>{r.courseCode}</td>
                        <td>{r.courseName}</td>
                        <td>{r.totalScore !== null && r.totalScore !== undefined ? formatScore(r.totalScore) : "—"}</td>
                        <td>{getScale4(r.totalScore)}</td>
                        <td><GradeStatusBadge status={r.status} /></td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
