export const ROLE_MENUS = {
  student: [
    { key: "dashboard", label: "Tổng quan", path: "/dashboard", icon: "⌂" },
    { key: "transcript", label: "Bảng điểm", path: "/transcript", icon: "▦" },
  ],
  lecturer: [
    { key: "dashboard", label: "Tổng quan", path: "/dashboard", icon: "⌂" },
    { key: "grade-input", label: "Nhập điểm", path: "/grades/input", icon: "✎" },
  ],
  academic_staff: [
    { key: "dashboard", label: "Tổng quan", path: "/dashboard", icon: "⌂" },
    { key: "academic", label: "Xử lý học vụ", path: "/academic", icon: "◈" },
  ],
  admin: [
    { key: "dashboard", label: "Tổng quan", path: "/dashboard", icon: "⌂" },
    { key: "users", label: "Quản lý tài khoản", path: "/admin/users", icon: "◎" },
    { key: "audit-logs", label: "Nhật ký", path: "/admin/audit-logs", icon: "≡" },
    { key: "system", label: "Hệ thống", path: "/admin/system", icon: "⚙" },
  ],
};

export function getMenuByRole(role) {
  return ROLE_MENUS[role] || [];
}

export const ROLE_LABELS = {
  student: "Sinh viên",
  lecturer: "Giảng viên",
  academic_staff: "Giáo vụ",
  admin: "Admin",
};
