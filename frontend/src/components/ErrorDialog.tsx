import React from 'react';
import '../styles/error-dialog.css';

type Props = {
  title: string;
  message: string;
  iconSrc?: string;
  onClose?: () => void;
};

export default function ErrorDialog({ title, message, iconSrc = '/report-blue.png', onClose }: Props) {
  return (
    <div className="error-dialog-overlay" role="dialog" aria-modal="true">
      <div className="error-dialog-card">
        <div className="error-dialog-header">
          <img src={iconSrc} alt="Erro" className="error-dialog-icon" />
          <h3 className="error-dialog-title">{title}</h3>
        </div>
        <p className="error-dialog-message">{message}</p>
        <div className="error-dialog-actions">
          <button className="error-dialog-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}