import React from "react";
import "./ConfirmModal.css";

const ConfirmModal = ({
  open,
  onClose,
  title = "Confirm",
  subtitle,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  danger = false,
  logoSrc
}) => {
  if (!open) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className={`confirm-modal-content ${danger ? "danger" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="confirm-modal-title-group">
            {logoSrc && <img src={logoSrc} alt="logo" className="confirm-modal-logo" />}
            <div>
              <h2 className="confirm-modal-title">{title}</h2>
              {subtitle && <div className="confirm-modal-subtitle">{subtitle}</div>}
            </div>
          </div>
          <button className="confirm-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="confirm-modal-body">
          <div className="confirm-modal-icon">{danger ? "⚠️" : "ℹ️"}</div>
          <div className="confirm-modal-text">
            <p className="confirm-modal-desc">{description}</p>
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button className="btn-secondary" onClick={onClose}>{cancelText}</button>
          <button className={`btn-primary ${danger ? "danger" : ""}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
