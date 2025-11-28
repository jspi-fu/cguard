import { NextRequest, NextResponse } from 'next/server';
import { reviewEngine } from '@/lib/services/reviewEngine';

interface BatchItem {
  id?: string;
  text?: string;
  photo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: BatchItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of items) {
      try {
        const payload = {
          id: item.id,
          text: item.text,
          photo: item.photo,
        };

        const outputs = await reviewEngine.submit(payload);
        
        results.push({
          id: item.id,
          status: 'succeeded',
          outputs,
        });

        // 添加 350ms 延迟（批量处理缓冲）
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          id: item.id,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

