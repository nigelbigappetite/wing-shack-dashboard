import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Deliveroo webhook received:', body);
  } catch (err) {
    console.error('Failed to parse Deliveroo webhook body', err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

