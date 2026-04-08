import { NextRequest, NextResponse } from 'next/server';
import { taskService } from '@/lib/services/taskService';
import { toErrorResponse } from '@/lib/http/toErrorResponse';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await taskService.get(params.id);
    return NextResponse.json(item);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const item = await taskService.update(params.id, body);
    return NextResponse.json(item);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await taskService.remove(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
