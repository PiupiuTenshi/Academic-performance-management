// Map role -> danh sách menu sidebar
export const ROLE_MENUS = {
  student: [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { key: "transcript", label: "Bảng điểm", path: "/transcript", icon: "📋" },
  ],
  lecturer: [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { key: "grade-input", label: "Nhập điểm", path: "/grades/input", icon: "✏️" },
  ],
  academic_staff: [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { key: "academic", label: "Xử lý học vụ", path: "/academic", icon: "🎓" },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { key: "users", label: "Quản lý User", path: "/admin/users", icon: "👥" },
    { key: "audit-logs", label: "Nhật ký hệ thống", path: "/admin/audit-logs", icon: "📝" },
  ],
};

export function getMenuByRole(role) {
  return ROLE_MENUS[role] || [];
}

// Nhãn hiển thị của role
export const ROLE_LABELS = {
  student: "Sinh viên",
  lecturer: "Giảng viên",
  academic_staff: "Giáo vụ",
  admin: "Admin",
};
