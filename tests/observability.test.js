import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  reportError,
  _resetReportedForTests,
} from '../src/lib/observability.js';

describe('observability', () => {
  beforeEach(() => {
    _resetReportedForTests();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reportError dedupes identical kind+message', () => {
    reportError('test', 'same');
    reportError('test', 'same');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('reportError logs distinct messages separately', () => {
    reportError('test', 'a');
    reportError('test', 'b');
    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it('reportError tags console output with kind', () => {
    reportError('react', 'render boom');
    expect(String(console.error.mock.calls[0][0])).toContain('roma:react');
    expect(String(console.error.mock.calls[0][1])).toContain('render boom');
  });
});
