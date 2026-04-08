import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/services/taskService';
import { toErrorResponse } from '@/lib/http/toErrorResponse';

export async function GET(req: NextRequest) {
  try {
    const q = Object.fromEntries(req.nextUrl.searchParams.entries());
    const result = await taskService.list(q);
    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await taskService.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
