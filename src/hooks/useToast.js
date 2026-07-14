import { useCallback, useRef, useState } from 'react';

/** Transient status message with auto-dismiss. */
export function useToast(durationMs = 2200) {
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback(
    (msg) => {
      setMessage(msg);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  return { message, showToast, clearToast: () => setMessage(null) };
}
