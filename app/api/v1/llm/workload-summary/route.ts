import { NextRequest, NextResponse } from 'next/server';
import { assertLlmRateLimit } from '@/lib/http/llmRateLimit';
import { toErrorResponse } from '@/lib/http/toErrorResponse';
import { llmService } from '@/lib/services/llmService';

export async function POST(req: NextRequest) {
  let stream = false;
  try {
    const body = (await req.json()) as { stream?: boolean };
    stream = Boolean(body?.stream);
  } catch {}

  try {
    assertLlmRateLimit(req);
  } catch (e) {
    return toErrorResponse(e);
  }

  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llmService.workloadSummaryStream()) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (e) {
          controller.error(
            e instanceof Error ? e : new Error('LLM stream failed')
          );
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    const result = await llmService.workloadSummary();
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
