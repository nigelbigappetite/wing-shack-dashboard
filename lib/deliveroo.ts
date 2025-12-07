// lib/deliveroo.ts

const DELIVEROO_AUTH_URL =
  'https://api.developers.deliveroo.com/auth/token';

const DELIVEROO_ORDERS_BASE =
  'https://api.developers.deliveroo.com/order/v1';

/**
 * Get an access token from Deliveroo using client_credentials.
 */
async function getDeliverooAccessToken(): Promise<string> {
  const clientId = process.env.DELIVEROO_CLIENT_ID;
  const clientSecret = process.env.DELIVEROO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      'Missing DELIVEROO_CLIENT_ID or DELIVEROO_CLIENT_SECRET env vars',
    );
    throw new Error('Deliveroo credentials not configured');
  }

  const res = await fetch(DELIVEROO_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'orders',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Deliveroo OAuth failed:', res.status, text);
    throw new Error(`Deliveroo OAuth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * Notify Deliveroo that our internal handling of the order has succeeded.
 * This is what closes the Sandbox test ("sync_status not called").
 */
export async function sendDeliverooSyncStatus(orderId: string): Promise<void> {
  if (!orderId) {
    console.error('sendDeliverooSyncStatus called without orderId');
    return;
  }

  const token = await getDeliverooAccessToken();

  const url = `${DELIVEROO_ORDERS_BASE}/orders/${encodeURIComponent(
    orderId,
  )}/sync_status`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      occurred_at: new Date().toISOString(),
      status: 'succeeded',
    }),
  });

  // 409 = sync_status already set; that's fine in our case.
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    console.error(
      `Deliveroo sync_status failed for ${orderId}:`,
      res.status,
      text,
    );
    throw new Error(`Deliveroo sync_status failed: ${res.status}`);
  }

  console.log(`Deliveroo sync_status sent for order ${orderId}`);
}
