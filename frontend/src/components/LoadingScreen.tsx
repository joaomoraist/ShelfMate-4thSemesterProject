import React from 'react';
import '../styles/loading.css';

type LoadingScreenProps = {
  message?: string;
  subtext?: string;
};

export default function LoadingScreen({ message = 'Carregando', subtext }: LoadingScreenProps) {
  return (
    <div className="loading-overlay" aria-busy="true" aria-live="polite">
      <div className="loading-card">
        <div className="brand">
          <img src="/logo-removebg.png" alt="Shelf Mate" />
          <span>Shelf Mate</span>
        </div>
        <div className="spinner" />
        <div className="loading-message">{message}…</div>
        {subtext ? <div className="loading-subtext">{subtext}</div> : null}
      </div>
    </div>
  );
}