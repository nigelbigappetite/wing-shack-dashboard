import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const body = new URLSearchParams({
      client_id: process.env.DELIVEROO_CLIENT_ID || '',
      client_secret: process.env.DELIVEROO_CLIENT_SECRET || '',
      grant_type: 'client_credentials',
    });

    const response = await fetch('https://auth-sandbox.developers.deliveroo.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: body.toString(),
    });

    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      return NextResponse.json({
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      });
    } else {
      const rawResponseText = await response.text();
      return NextResponse.json(
        {
          error: 'Auth failed',
          status: response.status,
          body: rawResponseText,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

