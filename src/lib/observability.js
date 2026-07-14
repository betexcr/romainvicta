const reported = new Set();

function getRelease() {
  try {
    return import.meta.env?.VITE_APP_VERSION || 'dev';
  } catch {
    return 'dev';
  }
}

function getTelemetryUrl() {
  try {
    const url = import.meta.env?.VITE_TELEMETRY_URL;
    return typeof url === 'string' && url.trim() ? url.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Deduped client error reporter. Console always; optional sendBeacon when
 * VITE_TELEMETRY_URL is configured and CSP connect-src allows it.
 */
export function reportError(kind, message, extra) {
  const key = `${kind}:${message}`;
  if (reported.has(key)) return;
  reported.add(key);

  const release = getRelease();
  const payload = {
    kind,
    message: String(message || 'Unknown error'),
    release,
    url: typeof location !== 'undefined' ? location.href : '',
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    extra: extra ?? null,
    ts: Date.now(),
  };

  console.error(`[roma:${kind}]`, payload.message, extra || '', { release });

  const endpoint = getTelemetryUrl();
  if (!endpoint || typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return;
  }
  try {
    const body = JSON.stringify(payload);
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
  } catch (err) {
    console.warn('[roma:telemetry]', err);
  }
}

/** @internal test helper */
export function _resetReportedForTests() {
  reported.clear();
}

export function installClientObservability() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    reportError('error', event.message || 'Unknown error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason || 'Unhandled rejection');
    reportError('unhandledrejection', message, reason);
  });
}
