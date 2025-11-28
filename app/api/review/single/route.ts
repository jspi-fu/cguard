import { NextRequest, NextResponse } from 'next/server';
import { reviewEngine } from '@/lib/services/reviewEngine';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const id = formData.get('id') as string | null;
    const text = formData.get('text') as string | null;
    const photo = formData.get('photo') as string | null;
    const photoFile = formData.get('photo_file') as File | null;

    const payload = {
      id: id || undefined,
      text: text || undefined,
      photo: photo || undefined,
    };

    const outputs = await reviewEngine.submit(
      payload,
      photoFile || undefined
    );

    return NextResponse.json({
      id: payload.id,
      status: 'succeeded',
      outputs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 判断错误类型，返回相应的状态码
    if (errorMessage.includes('File not found') || errorMessage.includes('At least one input')) {
      return NextResponse.json(
        {
          id: undefined,
          status: 'failed',
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes('Dify')) {
      return NextResponse.json(
        {
          id: undefined,
          status: 'failed',
          error: errorMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        id: undefined,
        status: 'failed',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

