import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, formatErrorBody } from '@/lib/ApiError';

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(formatErrorBody(err), { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: err.flatten(),
        },
      },
      { status: 400 }
    );
  }
  console.error(err);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err instanceof Error
              ? err.message
              : 'Internal server error',
      },
    },
    { status: 500 }
  );
}
