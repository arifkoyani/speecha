import { NextRequest, NextResponse } from 'next/server';

// Handle POST request to /api/webhook endpoint (text + voiceId for voice generation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return NextResponse.json(
        { error: 'Voice ID is required and must be a string' },
        { status: 400 }
      );
    }

    // Forward request to the actual webhook
    const webhookUrl = 'https://automation.uconnect.work/webhook/dd2a06d7-396b-465e-98f8-c1fad30162eb';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text,
    voice: voiceId,
    model_id: "eleven_v3" }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      return NextResponse.json(
        { error: `Webhook request failed: ${webhookResponse.statusText}` },
        { status: webhookResponse.status }
      );
    }

    // Check if response is audio or JSON
    const contentType = webhookResponse.headers.get('content-type');
    
    if (contentType && contentType.includes('audio/')) {
      // Response is audio file
      const audioBuffer = await webhookResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      
      // Determine file extension from content type
      let fileExtension = 'mpga';
      let fileName = 'data.mpga';
      
      if (contentType.includes('mpeg')) {
        fileExtension = 'mpga';
        fileName = 'data.mpga';
      } else if (contentType.includes('mp3')) {
        fileExtension = 'mp3';
        fileName = 'data.mp3';
      } else if (contentType.includes('wav')) {
        fileExtension = 'wav';
        fileName = 'data.wav';
      } else if (contentType.includes('ogg')) {
        fileExtension = 'ogg';
        fileName = 'data.ogg';
      }

      return NextResponse.json({
        success: true,
        file: {
          fileName,
          fileExtension,
          mimeType: contentType,
          fileSize: audioBuffer.byteLength,
          audioBase64,
        },
        text,
        voiceId,
      });
    } else {
      // Response is JSON
      let data;
      try {
        data = await webhookResponse.json();
      } catch (parseError) {
        console.error('Failed to parse webhook response as JSON:', parseError);
        return NextResponse.json(
          { error: 'Invalid JSON response from webhook' },
          { status: 500 }
        );
      }
      
      // Handle array response format: [{ "audio": "base64string..." }] or [{ "data": "base64string..." }]
      if (Array.isArray(data) && data.length > 0) {
        // Check for "audio" property first (new format), then fallback to "data" (old format)
        const base64Audio = data[0].audio || data[0].data;
        
        if (base64Audio && typeof base64Audio === 'string') {
          // Calculate file size from base64 string
          // Base64 encoding increases size by ~33%, so we decode to get actual size
          const base64Length = base64Audio.length;
          const padding = (base64Audio.match(/=/g) || []).length;
          const fileSize = Math.floor((base64Length * 3) / 4) - padding;
          
          return NextResponse.json({
            success: true,
            file: {
              fileName: 'data.mpga',
              fileExtension: 'mpga',
              mimeType: 'audio/mpeg',
              fileSize: fileSize,
              audioBase64: base64Audio,
            },
            text,
            voiceId,
          });
        }
      }
      
      // If the webhook returns the audio data in JSON format (object)
      if (data.audioBase64 || data.audioUrl || data.file) {
        return NextResponse.json({
          success: true,
          file: data.file || {
            fileName: data.fileName || 'data.mpga',
            fileExtension: data.fileExtension || 'mpga',
            mimeType: data.mimeType || 'audio/mpeg',
            fileSize: data.fileSize || 0,
            ...(data.audioBase64 && { audioBase64: data.audioBase64 }),
            ...(data.audioUrl && { audioUrl: data.audioUrl }),
          },
          text,
          voiceId,
        });
      }
      
      // If data object has a "data" property directly
      if (data.data && typeof data.data === 'string') {
        const base64Audio = data.data;
        const base64Length = base64Audio.length;
        const padding = (base64Audio.match(/=/g) || []).length;
        const fileSize = Math.floor((base64Length * 3) / 4) - padding;
        
        return NextResponse.json({
          success: true,
          file: {
            fileName: 'data.mpga',
            fileExtension: 'mpga',
            mimeType: 'audio/mpeg',
            fileSize: fileSize,
            audioBase64: base64Audio,
          },
          text,
          voiceId,
        });
      }
      
      // If data object has an "audio" property directly (not in array)
      if (data.audio && typeof data.audio === 'string') {
        const base64Audio = data.audio;
        const base64Length = base64Audio.length;
        const padding = (base64Audio.match(/=/g) || []).length;
        const fileSize = Math.floor((base64Length * 3) / 4) - padding;
        
        return NextResponse.json({
          success: true,
          file: {
            fileName: 'data.mpga',
            fileExtension: 'mpga',
            mimeType: 'audio/mpeg',
            fileSize: fileSize,
            audioBase64: base64Audio,
          },
          text,
          voiceId,
        });
      }
      
      // Log unexpected response format for debugging
      console.error('Unexpected webhook response format:', JSON.stringify(data).substring(0, 200));
      
      // Return error if we can't parse the response
      return NextResponse.json(
        { 
          error: 'Unable to extract audio data from webhook response',
          details: 'Response format not recognized'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing webhook request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

