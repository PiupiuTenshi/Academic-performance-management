import React from "react";
import { formatScore } from "../../utils/formatScore";

export default function GradeTable({ students, grades, onChange, readOnly }) {
  const FIELDS = [
    { key: "attendanceScore", label: "Điểm CC (10%)" },
    { key: "assignmentScore", label: "Bài tập (20%)" },
    { key: "midtermScore", label: "Giữa kỳ (20%)" },
    { key: "finalScore", label: "Cuối kỳ (50%)" },
  ];

  if (!students || students.length === 0) {
    return <p className="empty-text">Không có sinh viên trong lớp này.</p>;
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

  // Row-level score validation
  function getRowErrors(cc, bt, gk, ck) {
    const errors = [];
    const hasAny = cc !== "" || bt !== "" || gk !== "" || ck !== "";
    const hasAll = cc !== "" && bt !== "" && gk !== "" && ck !== "";

    if (hasAny && !hasAll) {
      errors.push("Thiếu cột điểm");
    }

    const check = (val, label) => {
      if (val === "" || val === null || val === undefined) return;
      const n = Number(val);
      if (isNaN(n)) {
        errors.push(`${label} không phải số`);
        return;
      }
      if (n < 0 || n > 10) {
        errors.push(`${label} phải từ 0-10`);
      }
    };
    check(cc, "Chuyên cần");
    check(bt, "Bài tập");
    check(gk, "Giữa kỳ");
    check(ck, "Cuối kỳ");
    return errors;
  }

  return (
    <div className="table-wrapper">
      <table className="grade-input-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>STT</th>
            <th>Mã SV</th>
            <th className="align-left">Họ tên</th>
            {FIELDS.map((f) => <th key={f.key}>{f.label}</th>)}
            <th>Điểm Tk (10)</th>
            <th>Điểm Tk (4)</th>
            <th>Điểm TK (C)</th>
            <th className="align-left" style={{ width: 180 }}>Lỗi</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => {
            const g = grades[s.enrollmentId] || {};
            const cc = g.attendanceScore ?? "";
            const bt = g.assignmentScore ?? "";
            const gk = g.midtermScore ?? "";
            const ck = g.finalScore ?? "";

            // Check errors
            const errors = getRowErrors(cc, bt, gk, ck);
            const hasError = errors.length > 0;

            // Auto calculations
            let displayTk10 = "—";
            let displayTk4 = "—";
            let displayTkC = "—";

            const isAllFilled = cc !== "" && bt !== "" && gk !== "" && ck !== "";

            if (isAllFilled && !hasError) {
              const rawTotal = Number(cc) * 0.1 + Number(bt) * 0.2 + Number(gk) * 0.2 + Number(ck) * 0.5;
              const roundedTotal = Math.round(rawTotal * 10) / 10;
              displayTk10 = formatScore(roundedTotal);
              displayTk4 = getScale4(roundedTotal);
              displayTkC = getLetterGrade(roundedTotal);
            } else if (!isAllFilled && s.totalScore !== null && s.totalScore !== undefined) {
              // Fallback to database values if not all inputs are modified
              displayTk10 = formatScore(s.totalScore);
              displayTk4 = getScale4(s.totalScore);
              displayTkC = getLetterGrade(s.totalScore);
            }

            return (
              <tr key={s.enrollmentId}>
                <td>{idx + 1}</td>
                <td>{s.studentCode}</td>
                <td className="align-left" style={{ fontWeight: 500 }}>{s.fullName}</td>
                {FIELDS.map((f) => {
                  const val = g[f.key] ?? "";
                  const invalid = val !== "" && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 10 || (String(Number(val)).indexOf(".") !== -1 && String(Number(val)).length - String(Number(val)).indexOf(".") - 1 > 1));
                  return (
                    <td key={f.key}>
                      <input
                        type="text"
                        className={`score-input ${invalid ? "invalid-score" : ""}`}
                        value={val}
                        onChange={(e) => onChange(s.enrollmentId, f.key, e.target.value)}
                        disabled={readOnly}
                        placeholder="—"
                      />
                    </td>
                  );
                })}
                <td style={{ fontWeight: 700 }}>{displayTk10}</td>
                <td style={{ fontWeight: 700 }}>{displayTk4}</td>
                <td style={{ fontWeight: 700 }}>{displayTkC}</td>
                <td className="align-left">
                  {hasError && (
                    <span className="error-text">
                      ⚠️ {errors.join(", ")}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
