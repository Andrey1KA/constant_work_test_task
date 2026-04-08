import { describe, it, expect, vi, afterEach } from 'vitest';
import { ZodError } from 'zod';
import { toErrorResponse } from '@/lib/http/toErrorResponse';
import { ApiError } from '@/lib/ApiError';

describe('toErrorResponse', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('returns success false and error code for ApiError', async () => {
    const res = toErrorResponse(
      new ApiError(404, 'NOT_FOUND', 'Task not found')
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found' },
    });
  });

  it('returns VALIDATION_ERROR for ZodError', async () => {
    const res = toErrorResponse(new ZodError([]));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
  });

  it('returns INTERNAL_ERROR for unknown errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = toErrorResponse(new Error('boom'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
