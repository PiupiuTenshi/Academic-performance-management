import React, { useCallback, useEffect, useState } from "react";
import Button from "../components/common/Button";
import GradeStatusBadge from "../components/grades/GradeStatusBadge";
import {
  calculateFinal,
  classifySemester,
  getAcademicRecords,
  getClasses,
  getClassStudents,
  getRetakes,
  getSemesters,
  updateGrade,
} from "../services/grade.api";
import { formatScore, isValidScore } from "../utils/formatScore";

const SCORE_FIELDS = [
  { key: "attendanceScore", label: "CC" },
  { key: "assignmentScore", label: "BT" },
  { key: "midtermScore", label: "GK" },
  { key: "finalScore", label: "CK" },
];

const CLASSIFICATION_LABEL = {
  excellent: { label: "Giỏi", color: "#166534", bg: "#dcfce7" },
  good: { label: "Khá", color: "#1d4ed8", bg: "#dbeafe" },
  average: { label: "Trung bình", color: "#92400e", bg: "#fef3c7" },
  weak: { label: "Yếu", color: "#991b1b", bg: "#fee2e2" },
};

function getScale4(score) {
  if (score === null || score === undefined || isNaN(Number(score))) return "-";
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

function getErrorMessage(error, fallback) {
  return error.response?.data?.error?.message || error.response?.data?.message || error.message || fallback;
}

function buildGradeState(students = []) {
  const initial = {};
  students.forEach((student) => {
    initial[student.enrollmentId] = {
      attendanceScore: student.attendanceScore ?? "",
      assignmentScore: student.assignmentScore ?? "",
      midtermScore: student.midtermScore ?? "",
      finalScore: student.finalScore ?? "",
    };
  });
  return initial;
}

function ClassificationBadge({ value }) {
  const info = CLASSIFICATION_LABEL[value] || { label: value || "-", color: "#475569", bg: "#f1f5f9" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: info.bg,
        color: info.color,
      }}
    >
      {info.label}
    </span>
  );
}

export default function AcademicProcessingPage() {
  const [semesters, setSemesters] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const [calcSemester, setCalcSemester] = useState("");
  const [calcClasses, setCalcClasses] = useState([]);
  const [calcClass, setCalcClass] = useState("");
  const [calcClassData, setCalcClassData] = useState(null);
  const [correctionGrades, setCorrectionGrades] = useState({});
  const [calcLoading, setCalcLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [savingGradeId, setSavingGradeId] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [correctionMessage, setCorrectionMessage] = useState(null);

  const [classifySem, setClassifySem] = useState("");
  const [classifyClasses, setClassifyClasses] = useState([]);
  const [classifyClass, setClassifyClass] = useState("");
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyError, setClassifyError] = useState("");
  const [classifyRecords, setClassifyRecords] = useState([]);
  const [classifySearch, setClassifySearch] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [retakeSem, setRetakeSem] = useState("");
  const [retakeClasses, setRetakeClasses] = useState([]);
  const [retakeClass, setRetakeClass] = useState("");
  const [retakes, setRetakes] = useState([]);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeError, setRetakeError] = useState("");
  const [retakeSearch, setRetakeSearch] = useState("");

  useEffect(() => {
    getSemesters().then(setSemesters).catch(() => {});
  }, []);

  useEffect(() => {
    if (!calcSemester) {
      setCalcClasses([]);
      setCalcClass("");
      return;
    }
    getClasses(calcSemester).then(setCalcClasses).catch(() => {});
  }, [calcSemester]);

  useEffect(() => {
    if (!calcClass) {
      setCalcClassData(null);
      setCorrectionGrades({});
      return;
    }

    setClassLoading(true);
    setCorrectionMessage(null);
    getClassStudents(calcClass)
      .then((data) => {
        setCalcClassData(data);
        setCorrectionGrades(buildGradeState(data.students));
      })
      .catch((error) => setCalcError(getErrorMessage(error, "Không tải được danh sách sinh viên.")))
      .finally(() => setClassLoading(false));
  }, [calcClass]);

  useEffect(() => {
    if (!classifySem) {
      setClassifyClasses([]);
      setClassifyClass("");
      return;
    }
    getClasses(classifySem).then(setClassifyClasses).catch(() => {});
  }, [classifySem]);

  const loadClassifyRecords = useCallback(async () => {
    if (!classifySem) {
      setClassifyRecords([]);
      return;
    }

    setRecordsLoading(true);
    try {
      const params = { semesterId: classifySem };
      if (classifyClass) params.classSectionId = classifyClass;
      if (classifySearch.trim()) params.keyword = classifySearch.trim();
      const data = await getAcademicRecords(params);
      setClassifyRecords(data || []);
    } catch {
      setClassifyRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [classifySem, classifyClass, classifySearch]);

  useEffect(() => {
    loadClassifyRecords();
  }, [loadClassifyRecords]);

  useEffect(() => {
    if (!retakeSem) {
      setRetakeClasses([]);
      setRetakeClass("");
      return;
    }
    getClasses(retakeSem).then(setRetakeClasses).catch(() => {});
  }, [retakeSem]);

  const handleLoadRetakes = useCallback(async () => {
    setRetakeLoading(true);
    setRetakeError("");
    try {
      const params = {};
      if (retakeSem) params.semesterId = retakeSem;
      const data = await getRetakes(params);

      if (retakeClass) {
        const classData = await getClassStudents(retakeClass);
        const enrolledStudentCodes = new Set((classData.students || []).map((s) => s.studentCode));
        const selectedClassObj = retakeClasses.find((c) => String(c.id) === String(retakeClass));
        const targetCourseCode = selectedClassObj?.courseCode;
        setRetakes(
          (data || []).filter(
            (item) => enrolledStudentCodes.has(item.studentCode) && (!targetCourseCode || item.courseCode === targetCourseCode),
          ),
        );
      } else {
        setRetakes(data || []);
      }
    } catch (error) {
      setRetakeError(getErrorMessage(error, "Không tải được dữ liệu học lại / thi lại."));
    } finally {
      setRetakeLoading(false);
    }
  }, [retakeSem, retakeClass, retakeClasses]);

  useEffect(() => {
    handleLoadRetakes();
  }, [handleLoadRetakes]);

  function handleCorrectionChange(enrollmentId, field, value) {
    setCorrectionGrades((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value,
      },
    }));
  }

  function normalizeGradePayload(grade) {
    const payload = {};
    for (const field of SCORE_FIELDS) {
      const value = grade[field.key];
      if (!isValidScore(value)) {
        throw new Error("Điểm phải trong khoảng 0-10 và tối đa 1 chữ số thập phân.");
      }
      payload[field.key] = value === "" || value === null || value === undefined ? null : Number(value);
    }
    return payload;
  }

  async function handleUpdateGrade(student) {
    if (!student.gradeId) return;
    setSavingGradeId(student.gradeId);
    setCorrectionMessage(null);
    try {
      const payload = normalizeGradePayload(correctionGrades[student.enrollmentId] || {});
      await updateGrade(student.gradeId, payload);
      setCorrectionMessage({ type: "success", text: `Đã cập nhật điểm cho ${student.studentCode}.` });

      const data = await getClassStudents(calcClass);
      setCalcClassData(data);
      setCorrectionGrades(buildGradeState(data.students));
    } catch (error) {
      setCorrectionMessage({ type: "error", text: getErrorMessage(error, "Cập nhật điểm thất bại.") });
    } finally {
      setSavingGradeId(null);
    }
  }

  async function handleCalculate() {
    if (!calcClass) {
      setCalcError("Vui lòng chọn lớp học phần.");
      return;
    }
    setCalcLoading(true);
    setCalcError("");
    setCalcResult(null);
    try {
      const result = await calculateFinal(Number(calcClass));
      setCalcResult(result);
      const data = await getClassStudents(calcClass);
      setCalcClassData(data);
      setCorrectionGrades(buildGradeState(data.students));
    } catch (error) {
      setCalcError(getErrorMessage(error, "Tính điểm thất bại."));
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleClassify() {
    if (!classifySem) {
      setClassifyError("Vui lòng chọn học kỳ.");
      return;
    }
    setClassifyLoading(true);
    setClassifyError("");
    setClassifyResult(null);
    try {
      const result = await classifySemester(Number(classifySem));
      setClassifyResult(result);
      await loadClassifyRecords();
    } catch (error) {
      setClassifyError(getErrorMessage(error, "Xếp loại thất bại."));
    } finally {
      setClassifyLoading(false);
    }
  }

  const TAB_STYLE = (tab) => ({
    padding: "9px 20px",
    border: "none",
    borderRadius: "var(--radius) var(--radius) 0 0",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: activeTab === tab ? "var(--white)" : "#f1f5f9",
    borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
    color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
  });

  const filteredRetakes = retakes.filter((item) => {
    const term = retakeSearch.trim().toLowerCase();
    if (!term) return true;
    return item.studentCode.toLowerCase().includes(term) || item.fullName.toLowerCase().includes(term);
  });

  return (
    <div className="page-container">
      <h1 className="page-title">Xử lý học vụ</h1>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        <button style={TAB_STYLE(1)} onClick={() => setActiveTab(1)}>1. Tính điểm</button>
        <button style={TAB_STYLE(2)} onClick={() => setActiveTab(2)}>2. Xếp loại</button>
        <button style={TAB_STYLE(3)} onClick={() => setActiveTab(3)}>3. Học lại / Thi lại</button>
      </div>

      {activeTab === 1 && (
        <>
          <div className="card">
            <div className="card-title">Tính điểm tổng kết lớp học phần</div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Backend yêu cầu bảng điểm đã khóa trước khi tính điểm tổng kết.
            </p>
            <div className="filter-row">
              <div className="form-group">
                <label className="form-label">Học kỳ</label>
                <select className="form-control" style={{ minWidth: 200 }} value={calcSemester} onChange={(e) => { setCalcSemester(e.target.value); setCalcClass(""); }}>
                  <option value="">-- Chọn học kỳ --</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>{semester.name} ({semester.academicYear})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lớp học phần</label>
                <select className="form-control" style={{ minWidth: 240 }} value={calcClass} disabled={!calcSemester || calcClasses.length === 0} onChange={(e) => setCalcClass(e.target.value)}>
                  <option value="">{!calcSemester ? "-- Chọn học kỳ trước --" : "-- Chọn lớp --"}</option>
                  {calcClasses.map((item) => (
                    <option key={item.id} value={item.id}>{item.sectionCode} - {item.courseName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                <Button variant="primary" onClick={handleCalculate} disabled={calcLoading || !calcClass}>
                  {calcLoading ? "Đang tính..." : "Tính điểm"}
                </Button>
              </div>
            </div>
            {calcError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{calcError}</p>}
            {calcResult && (
              <div style={{ background: "#dcfce7", borderRadius: "var(--radius)", padding: "12px 16px", marginTop: 12, color: "#166534" }}>
                Đã tính điểm cho <strong>{calcResult.calculatedCount}</strong> sinh viên.
              </div>
            )}
          </div>

          {calcClass && (
            <div className="card">
              <div className="card-title">Hiệu chỉnh điểm bằng PUT /grades/:id</div>
              {correctionMessage && (
                <div style={{ background: correctionMessage.type === "success" ? "#dcfce7" : "#fee2e2", color: correctionMessage.type === "success" ? "#166534" : "#991b1b", padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                  {correctionMessage.text}
                </div>
              )}
              {classLoading ? (
                <p className="loading-text">Đang tải danh sách sinh viên...</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ tên</th>
                        {SCORE_FIELDS.map((field) => <th key={field.key} style={{ textAlign: "center" }}>{field.label}</th>)}
                        <th style={{ textAlign: "center" }}>Tổng</th>
                        <th style={{ textAlign: "center" }}>Trạng thái</th>
                        <th style={{ textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(calcClassData?.students || []).map((student) => {
                        const grade = correctionGrades[student.enrollmentId] || {};
                        return (
                          <tr key={student.enrollmentId}>
                            <td>{student.studentCode}</td>
                            <td>{student.fullName}</td>
                            {SCORE_FIELDS.map((field) => (
                              <td key={field.key} style={{ textAlign: "center" }}>
                                <input
                                  className="score-input"
                                  style={{ width: 68 }}
                                  value={grade[field.key] ?? ""}
                                  onChange={(e) => handleCorrectionChange(student.enrollmentId, field.key, e.target.value)}
                                  placeholder="-"
                                />
                              </td>
                            ))}
                            <td style={{ textAlign: "center", fontWeight: 600 }}>{formatScore(student.totalScore)}</td>
                            <td style={{ textAlign: "center" }}><GradeStatusBadge status={student.status} /></td>
                            <td style={{ textAlign: "center" }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateGrade(student)}
                                disabled={!student.gradeId || savingGradeId === student.gradeId}
                              >
                                {savingGradeId === student.gradeId ? "Đang lưu..." : "Lưu"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 2 && (
        <div className="card">
          <div className="card-title">Xếp loại học lực theo học kỳ</div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Bảng này đọc trực tiếp từ backend /academic/records sau khi chạy /academic/classify.
          </p>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }} value={classifySem} onChange={(e) => { setClassifySem(e.target.value); setClassifyClass(""); setClassifyResult(null); }}>
                <option value="">-- Chọn học kỳ --</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name} ({semester.academicYear})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lọc theo lớp</label>
              <select className="form-control" style={{ minWidth: 240 }} value={classifyClass} disabled={!classifySem || classifyClasses.length === 0} onChange={(e) => setClassifyClass(e.target.value)}>
                <option value="">{!classifySem ? "-- Chọn học kỳ trước --" : "-- Tất cả lớp --"}</option>
                {classifyClasses.map((item) => (
                  <option key={item.id} value={item.id}>{item.sectionCode} - {item.courseName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tìm kiếm</label>
              <input className="form-control" style={{ minWidth: 220 }} placeholder="Mã SV hoặc họ tên..." value={classifySearch} onChange={(e) => setClassifySearch(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <Button variant="success" onClick={handleClassify} disabled={classifyLoading || !classifySem}>
                {classifyLoading ? "Đang xếp loại..." : "Xếp loại"}
              </Button>
              <Button variant="outline" onClick={loadClassifyRecords} disabled={recordsLoading || !classifySem}>
                Tải lại
              </Button>
            </div>
          </div>

          {classifyError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{classifyError}</p>}
          {classifyResult && (
            <div style={{ background: "#dcfce7", borderRadius: "var(--radius)", padding: "10px 16px", marginBottom: 16, color: "#166534" }}>
              Đã xếp loại cho <strong>{classifyResult.classifiedCount}</strong> sinh viên.
            </div>
          )}

          {recordsLoading ? (
            <p className="loading-text">Đang tải danh sách xếp loại...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Mã SV</th>
                    <th>Họ tên</th>
                    <th style={{ textAlign: "center" }}>DTB (10)</th>
                    <th style={{ textAlign: "center" }}>DTB (4)</th>
                    <th style={{ textAlign: "center" }}>Tín chỉ</th>
                    <th style={{ textAlign: "center" }}>Xếp loại</th>
                    <th style={{ textAlign: "center" }}>Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {classifyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        Chưa có dữ liệu xếp loại phù hợp.
                      </td>
                    </tr>
                  ) : (
                    classifyRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.studentCode}</td>
                        <td>{record.fullName}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{formatScore(record.averageScore)}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{getScale4(record.averageScore)}</td>
                        <td style={{ textAlign: "center" }}>{record.totalCredits}</td>
                        <td style={{ textAlign: "center" }}><ClassificationBadge value={record.classification} /></td>
                        <td style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                          {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("vi-VN") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {classifyRecords.length > 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
                  Hiển thị {classifyRecords.length} sinh viên
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="card">
          <div className="card-title">Danh sách học lại / thi lại</div>
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Học kỳ</label>
              <select className="form-control" style={{ minWidth: 200 }} value={retakeSem} onChange={(e) => { setRetakeSem(e.target.value); setRetakeClass(""); }}>
                <option value="">-- Tất cả --</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>{semester.name} ({semester.academicYear})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lọc theo lớp</label>
              <select className="form-control" style={{ minWidth: 240 }} value={retakeClass} disabled={!retakeSem || retakeClasses.length === 0} onChange={(e) => setRetakeClass(e.target.value)}>
                <option value="">{!retakeSem ? "-- Chọn học kỳ trước --" : "-- Tất cả lớp --"}</option>
                {retakeClasses.map((item) => (
                  <option key={item.id} value={item.id}>{item.sectionCode} - {item.courseName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tìm kiếm</label>
              <input className="form-control" style={{ minWidth: 240 }} placeholder="Mã SV hoặc họ tên..." value={retakeSearch} onChange={(e) => setRetakeSearch(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
              <Button variant="outline" onClick={handleLoadRetakes} disabled={retakeLoading}>
                {retakeLoading ? "Đang tải..." : "Tải lại"}
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
                    filteredRetakes.map((item) => (
                      <tr key={item.id}>
                        <td>{item.studentCode}</td>
                        <td>{item.fullName}</td>
                        <td>{item.courseCode}</td>
                        <td>{item.courseName}</td>
                        <td style={{ textAlign: "center" }}>{formatScore(item.totalScore)}</td>
                        <td style={{ textAlign: "center" }}>{getScale4(item.totalScore)}</td>
                        <td style={{ textAlign: "center" }}><GradeStatusBadge status={item.status} /></td>
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
