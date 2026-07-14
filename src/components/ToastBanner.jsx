import React from 'react';

export default function ToastBanner({ message, theme, goldBorder = false }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        background: theme.panelSolid,
        border: `1px solid ${goldBorder ? theme.gold : theme.border}`,
        borderRadius: 8,
        padding: '10px 20px',
        color: goldBorder ? theme.gold : theme.text,
        fontSize: 13,
        letterSpacing: goldBorder ? 1 : undefined,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        animation: goldBorder ? 'fadeIn 0.2s ease' : undefined,
      }}
    >
      {message}
    </div>
  );
}
