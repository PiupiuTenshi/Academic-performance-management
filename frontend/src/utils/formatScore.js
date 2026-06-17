// Format điểm số thành chuỗi hiển thị
// null/undefined → "—"
// số → tối đa 1 chữ số thập phân
export function formatScore(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (isNaN(n)) return "—";
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

export function isValidScore(value) {
  if (value === "" || value === null || value === undefined) return true; // cho phép trống
  const n = Number(value);
  if (isNaN(n)) return false;
  if (n < 0 || n > 10) return false;
  // kiểm tra tối đa 1 chữ số thập phân
  const str = String(n);
  const dot = str.indexOf(".");
  if (dot !== -1 && str.length - dot - 1 > 1) return false;
  return true;
}
