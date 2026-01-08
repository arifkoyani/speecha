import { NextRequest, NextResponse } from 'next/server';

// Handle POST request to /api endpoint (text only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Process the text (you can add your logic here)
    // For now, just return a success response
    return NextResponse.json({
      success: true,
      message: 'Text received successfully',
      text: text,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

