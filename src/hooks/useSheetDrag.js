import { useCallback, useRef } from 'react';

/** Mobile bottom-sheet swipe-to-dismiss helpers. */
export function useSheetDrag() {
  const sheetDrag = useRef({ startY: 0, dy: 0, active: false });

  const sheetTouchStart = useCallback((e) => {
    sheetDrag.current = {
      startY: e.touches[0].clientY,
      dy: 0,
      active: true,
    };
  }, []);

  const mkSheetMove = useCallback(
    (ref) => (e) => {
      const sd = sheetDrag.current;
      if (!sd.active) return;
      sd.dy = Math.max(0, e.touches[0].clientY - sd.startY);
      if (ref.current) ref.current.style.transform = `translateY(${sd.dy}px)`;
    },
    [],
  );

  const mkSheetEnd = useCallback(
    (ref, closeFn) => () => {
      const sd = sheetDrag.current;
      sd.active = false;
      if (!ref.current) return;
      if (sd.dy > 80) {
        ref.current.style.transition = 'transform 0.25s ease';
        ref.current.style.transform = 'translateY(100%)';
        setTimeout(() => {
          closeFn();
          if (ref.current) {
            ref.current.style.transition = '';
            ref.current.style.transform = '';
          }
        }, 260);
      } else {
        ref.current.style.transition = 'transform 0.2s ease';
        ref.current.style.transform = 'translateY(0)';
        setTimeout(() => {
          if (ref.current) ref.current.style.transition = '';
        }, 200);
      }
    },
    [],
  );

  return { sheetDrag, sheetTouchStart, mkSheetMove, mkSheetEnd };
}
