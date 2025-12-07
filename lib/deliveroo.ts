/**
 * Deliveroo API helper functions
 */

/**
 * Get Deliveroo access token using client credentials flow
 */
export async function getDeliverooAccessToken(): Promise<string> {
  const clientId = process.env.DELIVEROO_CLIENT_ID;
  const clientSecret = process.env.DELIVEROO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('DELIVEROO_CLIENT_ID or DELIVEROO_CLIENT_SECRET not set');
  }

  const response = await fetch('https://api.developers.deliveroo.com/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Deliveroo access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Send sync status to Deliveroo for an order
 * @param orderId - The Deliveroo order ID
 */
export async function sendDeliverooSyncStatus(orderId: string): Promise<void> {
  const accessToken = await getDeliverooAccessToken();

  const response = await fetch(
    `https://api.developers.deliveroo.com/order/v1/orders/${orderId}/sync_status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        occurred_at: new Date().toISOString(),
        status: 'succeeded',
      }),
    }
  );

  // Ignore 409 (Conflict) errors
  if (response.status === 409) {
    console.log(`Deliveroo sync status 409 (already sent) for order ${orderId}`);
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send Deliveroo sync status: ${response.status} ${errorText}`
    );
  }

  console.log(`Deliveroo sync status sent successfully for order ${orderId}`);
}

