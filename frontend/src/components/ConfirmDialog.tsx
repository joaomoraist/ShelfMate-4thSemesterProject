import React from 'react';
import '../styles/confirm-dialog.css';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  iconSrc?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  iconSrc = '/trash.png',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog-card">
        <div className="confirm-dialog-header">
          <img src={iconSrc} alt="Confirmação" className="confirm-dialog-icon" />
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-button cancel" onClick={onCancel}>{cancelText}</button>
          <button className="confirm-dialog-button danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}