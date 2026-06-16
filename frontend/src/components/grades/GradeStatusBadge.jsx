import React from "react";

// Hiển thị badge màu theo trạng thái điểm
// status: "passed" | "retake" | "repeat" | null/undefined
const STATUS_MAP = {
  passed: { label: "ĐẠT", className: "badge badge-passed" },
  retake: { label: "THI LẠI", className: "badge badge-retake" },
  repeat: { label: "HỌC LẠI", className: "badge badge-repeat" },
};

export default function GradeStatusBadge({ status }) {
  const config = STATUS_MAP[status];
  if (!config) {
    return <span className="badge badge-pending">Chưa có</span>;
  }
  return <span className={config.className}>{config.label}</span>;
}
