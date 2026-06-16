import React, { useState, useEffect, useCallback } from "react";
import {
  getSemesters, getClasses, calculateFinal,
  classifySemester, getRetakes, getAcademicRecords,
  getClassStudents,
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

const CLASSIFICATION_LABEL = {
  excellent: { label: "Giỏi", color: "#166534", bg: "#dcfce7" },
  good:      { label: "Khá", color: "#1d4ed8", bg: "#dbeafe" },
  average:   { label: "Trung bình", color: "#92400e", bg: "#fef3c7" },
  weak:      { label: "Yếu", color: "#991b1b", bg: "#fee2e2" },
};

function ClassificationBadge({ value }) {
  const info = CLASSIFICATION_LABEL[value] || { label: value, color: "#475569", bg: "#f1f5f9" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      background: info.bg,
      color: info.color,
    }}>
      {info.label}
    </span>
  );
}

export default function AcademicProcessingPage() {
  const [semesters, setSemesters] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  // ── Tab 1: Tính điểm tổng kết ──────────────────────────────────────────
  const [calcSemester, setCalcSemester] = useState("");
  const [calcClasses, setCalcClasses] = useState([]);
  const [calcClass, setCalcClass] = useState("");
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState("");

  // ── Tab 2: Xếp loại học lực ────────────────────────────────────────────
  const [classifySem, setClassifySem] = useState("");
  const [classifyClasses, setClassifyClasses] = useState([]);
  const [classifyClass, setClassifyClass] = useState("");
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyError, setClassifyError] = useState("");
  const [classifyRecords, setClassifyRecords] = useState([]);
  const [classifySearch, setClassifySearch] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);

  // ── Tab 3: Học lại / Thi lại ───────────────────────────────────────────
  const [retakeSem, setRetakeSem] = useState("");
  const [retakeClasses, setRetakeClasses] = useState([]);
  const [retakeClass, setRetakeClass] = useState("");
  const [retakes, setRetakes] = useState([]);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeError, setRetakeError] = useState("");
  const [retakeSearch, setRetakeSearch] = useState("");

  // Load semesters once
  useEffect(() => {
    getSemesters()
      .then(setSemesters)
      .catch(() => {});
  }, []);

  // ── Tab 1: load classes when semester changes ──────────────────────────
  useEffect(() => {
    if (!calcSemester) { setCalcClasses([]); setCalcClass(""); return; }
    getClasses(calcSemester).then(setCalcClasses).catch(() => {});
  }, [calcSemester]);

  // ── Tab 2: load classes when semester changes ──────────────────────────
  useEffect(() => {
    if (!classifySem) { setClassifyClasses([]); setClassifyClass(""); setClassifyRecords([]); return; }
    getClasses(classifySem).then(setClassifyClasses).catch(() => {});
  }, [classifySem]);

  // ── Tab 2: reload records when semester or class changes ───────────────
  const loadClassifyRecords = useCallback(async (semId, classId) => {
    if (!semId) return;
    setRecordsLoading(true);
    try {
      const params = { semesterId: semId };
      if (classId) params.classSectionId = classId;
      const data = await getAcademicRecords(params);
      setClassifyRecords(data || []);
    } catch {
      setClassifyRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classifySem) loadClassifyRecords(classifySem, classifyClass);
    else setClassifyRecords([]);
  }, [classifySem, classifyClass, loadClassifyRecords]);

  // ── Tab 3: load classes when semester changes ──────────────────────────
  useEffect(() => {
    if (!retakeSem) { setRetakeClasses([]); setRetakeClass(""); return; }
    getClasses(retakeSem).then(setRetakeClasses).catch(() => {});
  }, [retakeSem]);

  // ── Tab 3: load retakes ────────────────────────────────────────────────
  const handleLoadRetakes = useCallback(async () => {
    setRetakeLoading(true);
    setRetakeError("");
    try {
      const params = {};
      if (retakeSem) params.semesterId = retakeSem;
      const data = await getRetakes(params);
      
      if (retakeClass) {
        const classData = await getClassStudents(retakeClass);
        const enrolledStudentCodes = new Set(
          (classData.students || []).map((s) => s.studentCode)
        );
        
        // Find the selected class's course code
        const selectedClassObj = retakeClasses.find(c => String(c.id) === String(retakeClass));
        const targetCourseCode = selectedClassObj?.courseCode;

        setRetakes((data || []).filter((r) => 
          enrolledStudentCodes.has(r.studentCode) &&
          (!targetCourseCode || r.courseCode === targetCourseCode)
        ));
      } else {
        setRetakes(data || []);
      }
    } catch (err) {
      setRetakeError(
        err.response?.data?.error?.message || err.message ||
        "Không tải được dữ liệu học lại / thi lại."
      );
    } finally {
      setRetakeLoading(false);
    }
  }, [retakeSem, retakeClass, retakeClasses]);

  // Auto-load retakes when semester or class changes
  useEffect(() => {
    handleLoadRetakes();
  }, [handleLoadRetakes]);

  // ── Tab 1: handlers ────────────────────────────────────────────────────
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

  // ── Tab 2: handlers ────────────────────────────────────────────────────
  async function handleClassify() {
    if (!classifySem) { setClassifyError("Vui lòng chọn học kỳ."); return; }
    setClassifyLoading(true); setClassifyError(""); setClassifyResult(null);
    try {
      const result = await classifySemester(Number(classifySem));
      setClassifyResult(result);
      // Reload records after classify
      await loadClassifyRecords(classifySem, classifyClass);
    } catch (err) {
      setClassifyError(err.response?.data?.message || "Xếp loại thất bại.");
    } finally { setClassifyLoading(false); }
  }

  // ── Shared tab style ───────────────────────────────────────────────────
  const TAB_STYLE = (t) => ({
    padding: "9px 20px", border: "none",
    borderRadius: "var(--radius) var(--radius) 0 0",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
    background: activeTab === t ? "var(--white)" : "#f1f5f9",
    borderBottom: activeTab === t ? "2px solid var(--primary)" : "2px solid transparent",
    color: activeTab === t ? "var(--primary)" : "var(--text-muted)",
  });

  // ── Filtered retakes ───────────────────────────────────────────────────
  const filteredRetakes = retakes.filter((r) => {
    const term = retakeSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      r.studentCode.toLowerCase().includes(term) ||
      r.fullName.toLowerCase().includes(term)
    );
  });

  // ── Filtered classification records ────────────────────────────────────
  const filteredRecords = classifyRecords.filter((r) => {
    const term = classifySearch.trim().toLowerCase();
    if (!term) return true;
    return (
      r.studentCode.toLowerCase().includes(term) ||
      r.fullName.toLowerCase().includes(term)
    );
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

      {/* ── Tab 1: Tính điểm ──────────────────────────────────────────────── */}
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
                value={calcSemester}
                onChange={(e) => { setCalcSemester(e.target.value); setCalcClass(""); }}>
                <option value="">— Chọn học kỳ —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lớp học phần</label>
              <select className="form-control" style={{ minWidth: 240 }}
                value={calcClass}
                disabled={!calcSemester || calcClasses.length === 0}
                onChange={(e) => setCalcClass(e.target.value)}>
                <option value="">
                  {!calcSemester ? "— Chọn học kỳ trước —" : "— Chọn lớp —"}
                </option>
                {calcClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.sectionCode} – {c.courseName}</option>
                ))}
              </select>
            </div>
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

      {/* ── Tab 2: Xếp loại học lực ────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="card">
          <div className="card-title">Xếp loại học lực theo học kỳ</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Xếp loại: Giỏi (≥8.0) · Khá (≥6.5) · Trung bình (≥5.0) · Yếu (&lt;5.0)
          </p>

          {/* Filters */}
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }}
                value={classifySem}
                onChange={(e) => { setClassifySem(e.target.value); setClassifyClass(""); setClassifyResult(null); }}>
                <option value="">— Chọn học kỳ —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lọc theo lớp</label>
              <select className="form-control" style={{ minWidth: 240 }}
                value={classifyClass}
                disabled={!classifySem || classifyClasses.length === 0}
                onChange={(e) => setClassifyClass(e.target.value)}>
                <option value="">
                  {!classifySem ? "— Chọn học kỳ trước —" : "— Tất cả lớp —"}
                </option>
                {classifyClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.sectionCode} – {c.courseName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tìm kiếm</label>
              <input
                type="text"
                className="form-control"
                style={{ minWidth: 220 }}
                placeholder="Mã SV hoặc họ tên..."
                value={classifySearch}
                onChange={(e) => setClassifySearch(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <Button variant="success" onClick={handleClassify} disabled={classifyLoading || !classifySem}>
                {classifyLoading ? "Đang xếp loại..." : "🎓 Xếp loại"}
              </Button>
            </div>
          </div>

          {classifyError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{classifyError}</p>}
          {classifyResult && (
            <div style={{ background: "#dcfce7", borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 16 }}>
              <strong style={{ color: "#166534" }}>✅ Xếp loại thành công!</strong>
              <span style={{ color: "#166534", fontSize: 13, marginLeft: 8 }}>
                Đã xếp loại cho <strong>{classifyResult.classifiedCount}</strong> sinh viên.
              </span>
            </div>
          )}

          {/* Results table */}
          {classifySem && (
            recordsLoading ? (
              <p className="loading-text">Đang tải danh sách xếp loại...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ tên</th>
                      <th style={{ textAlign: "center" }}>ĐTB (10)</th>
                      <th style={{ textAlign: "center" }}>ĐTB (4)</th>
                      <th style={{ textAlign: "center" }}>Tín chỉ TL</th>
                      <th style={{ textAlign: "center" }}>Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                          {classifySearch
                            ? "Không tìm thấy sinh viên phù hợp."
                            : "Chưa có dữ liệu xếp loại cho học kỳ này. Nhấn \"Xếp loại\" để tạo."}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.studentCode}</td>
                          <td>{r.fullName}</td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {r.averageScore !== null ? formatScore(r.averageScore) : "—"}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>
                            {getScale4(r.averageScore)}
                          </td>
                          <td style={{ textAlign: "center" }}>{r.totalCredits}</td>
                          <td style={{ textAlign: "center" }}>
                            <ClassificationBadge value={r.classification} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {filteredRecords.length > 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
                    Hiển thị {filteredRecords.length} / {classifyRecords.length} sinh viên
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Tab 3: Học lại / Thi lại ───────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="card">
          <div className="card-title">Danh sách học lại / thi lại</div>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Lọc học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }}
                value={retakeSem}
                onChange={(e) => { setRetakeSem(e.target.value); setRetakeClass(""); }}>
                <option value="">— Tất cả —</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lọc theo lớp</label>
              <select className="form-control" style={{ minWidth: 240 }}
                value={retakeClass}
                disabled={!retakeSem || retakeClasses.length === 0}
                onChange={(e) => setRetakeClass(e.target.value)}>
                <option value="">
                  {!retakeSem ? "— Chọn học kỳ trước —" : "— Tất cả lớp —"}
                </option>
                {retakeClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.sectionCode} – {c.courseName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tìm kiếm sinh viên</label>
              <input
                type="text"
                className="form-control"
                style={{ minWidth: 240 }}
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
                    <th style={{ textAlign: "center" }}>Điểm TK (10)</th>
                    <th style={{ textAlign: "center" }}>Điểm TK (4)</th>
                    <th style={{ textAlign: "center" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRetakes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        Không có sinh viên học lại / thi lại.
                      </td>
                    </tr>
                  ) : (
                    filteredRetakes.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.studentCode}</td>
                        <td>{r.fullName}</td>
                        <td>{r.courseCode}</td>
                        <td>{r.courseName}</td>
                        <td style={{ textAlign: "center" }}>
                          {r.totalScore !== null && r.totalScore !== undefined ? formatScore(r.totalScore) : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>{getScale4(r.totalScore)}</td>
                        <td style={{ textAlign: "center" }}>
                          <GradeStatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredRetakes.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
                  Hiển thị {filteredRetakes.length} / {retakes.length} sinh viên
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
