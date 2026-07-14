import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTextureWithRetry } from '../src/lib/assetRetry.js';

describe('assetRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries texture load once then succeeds', () => {
    let calls = 0;
    const loader = {
      load: (_url, onOk, _prog, onErr) => {
        calls += 1;
        if (calls === 1) onErr();
        else onOk({ id: 'tex' });
      },
    };
    const onLoad = vi.fn();
    const onFail = vi.fn();
    loadTextureWithRetry(loader, '/earth.jpg', onLoad, onFail, {
      retries: 1,
      delayMs: 500,
    });
    expect(calls).toBe(1);
    vi.advanceTimersByTime(500);
    expect(calls).toBe(2);
    expect(onLoad).toHaveBeenCalledWith({ id: 'tex' });
    expect(onFail).not.toHaveBeenCalled();
  });

  it('calls onFinalFail after exhausting retries', () => {
    const loader = {
      load: (_url, _ok, _prog, onErr) => onErr(),
    };
    const onLoad = vi.fn();
    const onFail = vi.fn();
    loadTextureWithRetry(loader, '/earth.jpg', onLoad, onFail, {
      retries: 1,
      delayMs: 100,
    });
    vi.advanceTimersByTime(100);
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(onLoad).not.toHaveBeenCalled();
  });
});
