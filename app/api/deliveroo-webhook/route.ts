import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    console.log(
      'Deliveroo webhook v2 received:',
      payload.event,
      payload.body?.order?.id,
    );

    if (!payload.body || !payload.body.order) {
      console.warn('Webhook payload missing body.order, ignoring');
      return NextResponse.json({ ignored: true }, { status: 200 });
    }

    const order = payload.body.order;

    const orderPlacedAt: string =
      order.confirm_at ||
      order.start_preparing_at ||
      order.prepare_for ||
      new Date().toISOString();

    const currency: string =
      order.total_price?.currency ||
      order.subtotal?.currency ||
      'GBP';

    const row = {
      platform: 'deliveroo',
      external_order_id: order.id,
      store_id: order.location_id,
      order_placed_at: orderPlacedAt,
      gross_amount: order.total_price?.value ?? null,
      net_amount: order.partner_order_total?.value ?? null,
      commission: null as number | null,
      delivery_fee: null as number | null,
      discount_total: order.offer_discount?.value ?? null,
      currency,
      raw_payload: payload as any,
    };

    console.log('Upserting into Supabase orders:', {
      platform: row.platform,
      external_order_id: row.external_order_id,
      store_id: row.store_id,
      order_placed_at: row.order_placed_at,
      gross_amount: row.gross_amount,
      net_amount: row.net_amount,
      discount_total: row.discount_total,
      currency: row.currency,
    });

    const { error } = await supabaseServer
      .from('orders')
      .upsert(row, { onConflict: 'platform,external_order_id' });

    if (error) {
      console.error('Supabase upsert failed:', error);
      return NextResponse.json(
        { error: 'Supabase upsert failed', details: error.message },
        { status: 500 },
      );
    }

    console.log('Supabase upsert success for order', order.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Deliveroo webhook handler error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || 'Unknown error'
            : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
