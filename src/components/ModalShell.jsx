import React, { useEffect, useRef } from 'react';

/**
 * Shared modal backdrop + focusable dialog panel.
 * Preserves existing Esc / click-outside / mobile bottom-sheet visuals.
 */
export default function ModalShell({
  open,
  onClose,
  labelledBy,
  isMobile,
  panelStyle,
  children,
  zIndex = 60,
  align = 'center',
  backdropOpacity = 0.7,
  backdropBlur = 6,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;
    if (document.activeElement !== el && !el.dataset.focused) {
      el.focus();
      el.dataset.focused = '1';
    }
    return () => {
      if (el) delete el.dataset.focused;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        display: 'flex',
        alignItems: isMobile || align === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        background: `rgba(0,0,0,${backdropOpacity})`,
        backdropFilter: `blur(${backdropBlur}px)`,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        tabIndex={-1}
        ref={panelRef}
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  );
}
