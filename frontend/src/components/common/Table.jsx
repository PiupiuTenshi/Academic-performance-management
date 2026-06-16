import React from "react";

// Generic table
// columns: [{ key, label, render? }]
// data: mảng object
export default function Table({ columns, data, loading, emptyText = "Không có dữ liệu" }) {
  if (loading) {
    return <p className="loading-text">Đang tải dữ liệu...</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id ?? idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
