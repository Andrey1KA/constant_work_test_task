import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assertLlmRateLimit } from '@/lib/http/llmRateLimit';
import { toErrorResponse } from '@/lib/http/toErrorResponse';
import { llmService } from '@/lib/services/llmService';

const bodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    assertLlmRateLimit(req);
    const body = bodySchema.parse(await req.json());
    const result = await llmService.decompose(body);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
