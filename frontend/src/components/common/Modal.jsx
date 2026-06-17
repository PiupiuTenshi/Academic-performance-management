import React from "react";

// Modal overlay
// isOpen: boolean
// title: string
// onClose: function
// children: nội dung
// footer: JSX các nút action (optional, nếu không truyền thì tự render children)
export default function Modal({ isOpen, title, onClose, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
