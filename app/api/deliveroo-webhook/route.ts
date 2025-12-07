import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendDeliverooSyncStatus } from '@/lib/deliveroo';

export async function POST(request: Request) {
  console.log('*** Deliveroo webhook HIT ***');
  try {
    const payload = await request.json();

    console.log(
      'Deliveroo webhook v2 received:',
      payload.event,
      payload.body?.order?.id,
    );

    console.log('Full Deliveroo payload:', JSON.stringify(payload, null, 2));

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

      const toPounds = (money?: { fractional: number; currency_code: string }) =>
        typeof money?.fractional === 'number' ? money.fractional / 100 : null;
      
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

    // Send sync status to Deliveroo if this is a status update and order is accepted
    if (payload.event === 'order.status_update') {
      console.log('Received order.status_update event for order', order.id);
      console.log('Order status:', order.status);
      console.log('Order status_log:', order.status_log);

      const isAccepted =
        order.status === 'accepted' ||
        (Array.isArray(order.status_log) &&
          order.status_log.some((log: any) => log.status === 'accepted'));

      console.log('Is order accepted?', isAccepted);

      if (isAccepted) {
        try {
          console.log('Calling sendDeliverooSyncStatus for order', order.id);
          await sendDeliverooSyncStatus(order.id);
          console.log(
            'sendDeliverooSyncStatus completed successfully for order',
            order.id,
          );
        } catch (error) {
          console.error(
            `Failed to send Deliveroo sync status for order ${order.id}:`,
            error,
          );
        }
      } else {
        console.log(
          'Not sending sync_status because order is not accepted. Current status:',
          order.status,
        );
      }
    } else {
      console.log('Non-status_update event received:', payload.event);
    }

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