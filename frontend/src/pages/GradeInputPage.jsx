import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getSemesters, getClasses, getClassStudents,
  saveBulkGrades, lockGrades,
} from "../services/grade.api";
import { isValidScore } from "../utils/formatScore";
import GradeTable from "../components/grades/GradeTable";
import Modal from "../components/common/Modal";
import { logout as logoutApi } from "../services/auth.api";
import logoImg from "../assets/logo.png";
import "./GradeInputPage.css";

export default function GradeInputPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const presetSemesterId = searchParams.get("semesterId") || "";
  const presetClassId = searchParams.get("classId") || "";
  
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classData, setClassData] = useState(null); // { classSection, students }
  const [grades, setGrades] = useState({}); // { enrollmentId: { attendanceScore, ... } }
  const [originalGrades, setOriginalGrades] = useState({});
  const [loadingClass, setLoadingClass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [showLockModal, setShowLockModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef(null);

  function getApiErrorMessage(error, fallback) {
    return error.response?.data?.error?.message
      || error.response?.data?.message
      || error.message
      || fallback;
  }

  useEffect(() => {
    if (presetSemesterId) {
      setSemesterId(presetSemesterId);
    }
  }, [presetSemesterId]);

  // Tải học kỳ
  useEffect(() => {
    getSemesters()
      .then(setSemesters)
      .catch(() => setMessage({ type: "error", text: "Không thể tải danh sách học kỳ. Kiểm tra kết nối backend." }));
  }, []);

  // Tải lớp khi chọn học kỳ
  useEffect(() => {
    if (!semesterId) { setClasses([]); setSelectedClass(""); setClassData(null); return; }
    getClasses(semesterId)
      .then((data) => {
        setClasses(data);
        if (presetClassId && data.some((c) => String(c.id) === String(presetClassId))) {
          setSelectedClass(presetClassId);
        }
      })
      .catch(() => setMessage({ type: "error", text: "Không thể tải danh sách lớp học phần." }));
  }, [semesterId, presetClassId]);

  // Tải danh sách SV khi chọn lớp
  useEffect(() => {
    if (!selectedClass) { setClassData(null); setGrades({}); setOriginalGrades({}); setSearchTerm(""); return; }
    setLoadingClass(true);
    getClassStudents(selectedClass)
      .then((data) => {
        setClassData(data);
        // Khởi tạo grades từ dữ liệu hiện có
        const initial = {};
        data.students.forEach((s) => {
          initial[s.enrollmentId] = {
            attendanceScore: s.attendanceScore ?? "",
            assignmentScore: s.assignmentScore ?? "",
            midtermScore: s.midtermScore ?? "",
            finalScore: s.finalScore ?? "",
          };
        });
        setGrades(initial);
        setOriginalGrades(initial);
      })
      .catch((err) => setMessage({ type: "error", text: err.response?.data?.error?.message || "Không thể tải danh sách sinh viên." }))
      .finally(() => setLoadingClass(false));
  }, [selectedClass]);

  function handleGradeChange(enrollmentId, field, value) {
    setGrades((prev) => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], [field]: value },
    }));
  }

  function handleSemesterSelect(value) {
    setSearchParams({});
    setSemesterId(value);
    setSelectedClass("");
  }

  function handleClassSelect(value) {
    setSearchParams({});
    setSelectedClass(value);
  }

  function handleBackToClassSelection() {
    if (semesterId) {
      setSearchParams({ semesterId });
    } else {
      setSearchParams({});
    }
    setSelectedClass("");
  }

  function normalizeScoreForCompare(value) {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }

  function isSameGrade(current = {}, original = {}) {
    const fields = ["attendanceScore", "assignmentScore", "midtermScore", "finalScore"];
    return fields.every((field) => {
      const currentValue = normalizeScoreForCompare(current[field]);
      const originalValue = normalizeScoreForCompare(original[field]);
      if (currentValue === null || originalValue === null) {
        return currentValue === originalValue;
      }
      return Math.abs(currentValue - originalValue) < 1e-9;
    });
  }

  function getChangedGradeEntries() {
    return Object.entries(grades).filter(([enrollmentId, grade]) => (
      !isSameGrade(grade, originalGrades[enrollmentId])
    ));
  }

  // Validate tất cả điểm trước khi lưu
  function validateAll() {
    const fields = ["attendanceScore", "assignmentScore", "midtermScore", "finalScore"];
    for (const [eid, g] of Object.entries(grades)) {
      for (const f of fields) {
        if (!isValidScore(g[f])) return false;
      }
    }
    return true;
  }

  async function handleSave() {
    if (!validateAll()) {
      setMessage({ type: "error", text: "Có điểm không hợp lệ (0–10, tối đa 1 chữ số thập phân)." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const changedEntries = getChangedGradeEntries();

      if (changedEntries.length === 0) {
        setMessage({ type: "success", text: "Không có thay đổi cần lưu." });
        return;
      }

      const gradePayload = changedEntries.map(([eid, g]) => ({
        enrollmentId: Number(eid),
        attendanceScore: g.attendanceScore !== "" ? Number(g.attendanceScore) : null,
        assignmentScore: g.assignmentScore !== "" ? Number(g.assignmentScore) : null,
        midtermScore: g.midtermScore !== "" ? Number(g.midtermScore) : null,
        finalScore: g.finalScore !== "" ? Number(g.finalScore) : null,
      }));
      const result = await saveBulkGrades(Number(selectedClass), gradePayload);
      const failedIds = new Set((result.errors || []).map((item) => String(item.enrollmentId)));
      const savedEntries = changedEntries.filter(([eid]) => !failedIds.has(String(eid)));

      setOriginalGrades((prev) => {
        const next = { ...prev };
        savedEntries.forEach(([eid]) => {
          next[eid] = { ...grades[eid] };
        });
        return next;
      });

      if (result.failedCount > 0) {
        setMessage({ type: "error", text: `Đã lưu ${result.savedCount} dòng, ${result.failedCount} dòng lỗi.` });
      } else {
        setMessage({ type: "success", text: `Đã lưu ${result.savedCount} thay đổi bản nháp thành công.` });
      }
    } catch (err) {
      setMessage({ type: "error", text: getApiErrorMessage(err, "Lưu điểm thất bại.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleLock() {
    setLocking(true);
    setShowLockModal(false);
    setMessage(null);
    try {
      await lockGrades(Number(selectedClass));
      setMessage({ type: "success", text: "Bảng điểm đã được khóa chính thức thành công!" });
      // Cập nhật UI
      setClassData((prev) => ({
        ...prev,
        classSection: { ...prev.classSection, isGradeLocked: true },
      }));
    } catch (err) {
      setMessage({ type: "error", text: getApiErrorMessage(err, "Khóa bảng điểm thất bại.") });
    } finally {
      setLocking(false);
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

  // Convert scale 10 to scale 4
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

  // Convert scale 10 to letter grade
  function getLetterGrade(score) {
    if (score === null || score === undefined || isNaN(Number(score))) return "—";
    const s = Number(score);
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

  function normalizeExcelCell(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function buildExcelRows() {
    const rows = [
      ["STT", "Mã SV", "Họ tên", "Điểm CC (10%)", "Bài tập (20%)", "Giữa kỳ (20%)", "Cuối kỳ (50%)", "Điểm TK (10)", "Điểm TK (4)", "Điểm TK (C)"],
    ];

    classData.students.forEach((s, idx) => {
      const g = grades[s.enrollmentId] || {};
      const cc = g.attendanceScore ?? "";
      const bt = g.assignmentScore ?? "";
      const gk = g.midtermScore ?? "";
      const ck = g.finalScore ?? "";

      let tk10 = "";
      let tk4 = "";
      let tkC = "";

      if (cc !== "" && bt !== "" && gk !== "" && ck !== "") {
        const score = Number(cc) * 0.1 + Number(bt) * 0.2 + Number(gk) * 0.2 + Number(ck) * 0.5;
        const rounded = Math.round(score * 10) / 10;
        tk10 = rounded;
        tk4 = getScale4(rounded);
        tkC = getLetterGrade(rounded);
      } else if (s.totalScore !== null && s.totalScore !== undefined) {
        tk10 = Number(s.totalScore);
        tk4 = getScale4(s.totalScore);
        tkC = getLetterGrade(s.totalScore);
      }

      rows.push([idx + 1, s.studentCode, s.fullName, cc, bt, gk, ck, tk10, tk4, tkC]);
    });

    return rows;
  }

  async function loadXlsx() {
    return import("xlsx");
  }

  // Excel (.xlsx) Export
  async function handleExportExcel() {
    if (!classData || !classData.students) return;
    const XLSX = await loadXlsx();
    const activeClassObj = classes.find((c) => Number(c.id) === Number(selectedClass));
    const fileName = activeClassObj ? `${activeClassObj.sectionCode}_${activeClassObj.courseName}` : "bang_diem";

    const worksheet = XLSX.utils.aoa_to_sheet(buildExcelRows());
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bang diem");
    XLSX.writeFile(workbook, `${fileName}_BangDiem.xlsx`);
  }

  // Excel (.xlsx) Import
  async function handleImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const XLSX = await loadXlsx();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      const newGrades = { ...grades };
      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        const parts = rows[i];
        if (!parts || parts.length < 7) continue;

        const studentCode = normalizeExcelCell(parts[1]);
        const cc = normalizeExcelCell(parts[3]);
        const bt = normalizeExcelCell(parts[4]);
        const gk = normalizeExcelCell(parts[5]);
        const ck = normalizeExcelCell(parts[6]);

        const student = classData.students.find((s) => s.studentCode === studentCode);
        if (student) {
          newGrades[student.enrollmentId] = {
            attendanceScore: cc,
            assignmentScore: bt,
            midtermScore: gk,
            finalScore: ck,
          };
          count++;
        }
      }

      setGrades(newGrades);
      setMessage({ type: "success", text: `Đã nạp thành công điểm của ${count} sinh viên từ file Excel.` });
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi đọc file. Vui lòng kiểm tra định dạng tệp tin .xlsx." });
    } finally {
      e.target.value = ""; // Reset
    }
  }

  const activeClassObj = classes.find((c) => Number(c.id) === Number(selectedClass));
  const courseName = activeClassObj?.courseName || "—";
  const sectionCode = activeClassObj?.sectionCode || "";
  const groupName = sectionCode.includes("-") ? sectionCode.split("-").pop() : sectionCode;
  const lecturerName = activeClassObj?.lecturerName || user?.username || "Trần Văn X";

  const isLocked = classData?.classSection?.isGradeLocked;

  return (
    <div className="grade-input-layout">
      {/* Mockup Header */}
      <header className="grade-input-header">
        <div className="grade-input-logo-container">
          <img src={logoImg} alt="PTIT Logo" />
        </div>
        <h1 className="grade-input-system-title">HỆ THỐNG QUẢN LÝ KẾT QUẢ HỌC TẬP</h1>
        <div className="grade-input-header-actions">
          <button className="grade-input-btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="grade-input-container">
        {/* Title row with back button */}
        <div className="grade-input-title-row">
          {selectedClass && (
            <button className="grade-input-btn-back" onClick={handleBackToClassSelection}>
              Quay lại
            </button>
          )}
          <h2>Nhập điểm học phần</h2>
        </div>

        {/* Step 1: Selection view (only shown if class not selected) */}
        {!selectedClass && (
          <div className="card">
            <div className="card-title">Bước 1: Chọn lớp học phần</div>
            <div className="filter-row">
              <div className="form-group">
                <label className="form-label">Học kỳ</label>
                <select
                  className="form-control"
                  style={{ minWidth: 220 }}
                  value={semesterId}
                  onChange={(e) => handleSemesterSelect(e.target.value)}
                >
                  <option value="">— Chọn học kỳ —</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>
                  ))}
                </select>
              </div>
              {classes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Lớp học phần</label>
                  <select
                    className="form-control"
                    style={{ minWidth: 260 }}
                    value={selectedClass}
                    onChange={(e) => handleClassSelect(e.target.value)}
                  >
                    <option value="">— Chọn lớp —</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.sectionCode} – {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div style={{
            padding: "12px 16px", borderRadius: "var(--radius)", marginBottom: 20,
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            fontSize: 14,
            fontWeight: 500,
            borderLeft: `4px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`
          }}>
            {message.text}
          </div>
        )}

        {/* Step 2: Grade Sheet view (only shown once class is selected) */}
        {selectedClass && (
          <>
            {/* Info Card */}
            <div className="grade-input-info-card">
              <div className="grade-input-info-grid">
                <div className="grade-input-info-item">
                  Học phần: <strong>{courseName}</strong>
                </div>
                <div className="grade-input-info-item">
                  Nhóm: <strong>{groupName}</strong>
                </div>
                <div className="grade-input-info-item">
                  Giảng viên: <strong>{lecturerName}</strong>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="grade-input-actions-row">
              {!isLocked ? (
                <>
                  <button className="grade-input-btn-excel-import" onClick={() => fileInputRef.current.click()}>
                    📥 Tải file Excel
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImportExcel}
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  />
                </>
              ) : <div />}
              
              <button className="grade-input-btn-excel-export" onClick={handleExportExcel}>
                📤 Xuất file Excel
              </button>
            </div>

            {/* Thanh tìm kiếm */}
            <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                className="form-control"
                style={{ maxWidth: 300, padding: "8px 12px", fontSize: 13.5 }}
                placeholder="🔍 Tìm kiếm Mã SV hoặc Họ tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: 13, textDecoration: "underline"
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Bảng điểm */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {loadingClass ? (
                <p className="loading-text">Đang tải danh sách sinh viên...</p>
              ) : (
                <GradeTable
                  students={(classData?.students || []).filter((s) => {
                    const term = searchTerm.trim().toLowerCase();
                    if (!term) return true;
                    return (
                      s.studentCode.toLowerCase().includes(term) ||
                      s.fullName.toLowerCase().includes(term)
                    );
                  })}
                  grades={grades}
                  onChange={handleGradeChange}
                  readOnly={isLocked}
                />
              )}
            </div>

            {/* Footer Actions */}
            {!isLocked && !loadingClass && (
              <div className="grade-input-footer-actions">
                <button
                  className="grade-input-btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
                <button
                  className="grade-input-btn-lock"
                  onClick={() => setShowLockModal(true)}
                  disabled={saving}
                >
                  Xác nhận lưu chính thức
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal xác nhận khóa */}
        <Modal
          isOpen={showLockModal}
          title="Xác nhận lưu điểm chính thức"
          onClose={() => setShowLockModal(false)}
          footer={
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn btn-outline"
                style={{ padding: "8px 18px" }}
                onClick={() => setShowLockModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: "8px 18px", fontWeight: 700 }}
                onClick={handleLock}
                disabled={locking}
              >
                {locking ? "Đang khóa..." : "Đồng ý khóa"}
              </button>
            </div>
          }
        >
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Sau khi xác nhận lưu chính thức, hệ thống sẽ **khóa bảng điểm**. Bạn sẽ **không thể** chỉnh sửa điểm của học phần này được nữa.
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, marginTop: 12 }}>
            Bạn có chắc chắn muốn lưu điểm chính thức cho lớp này không?
          </p>
        </Modal>
      </div>
    </div>
  );
}
