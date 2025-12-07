import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 1: Get SANDBOX access token
    const tokenRes = await fetch(
      "https://auth-sandbox.developers.deliveroo.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.DELIVEROO_CLIENT_ID || "",
          client_secret: process.env.DELIVEROO_CLIENT_SECRET || "",
          grant_type: "client_credentials",
        }).toString(),
      }
    );

    if (tokenRes.status < 200 || tokenRes.status >= 300) {
      const rawText = await tokenRes.text();
      return NextResponse.json(
        {
          error: "Auth failed",
          status: tokenRes.status,
          body: rawText,
        },
        { status: 500 }
      );
    }

    // Step 2: Parse token response
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Step 3: Debug logs
    console.log("RAW ACCESS TOKEN:", accessToken);
    console.log("TOKEN LENGTH:", accessToken?.length);

    // Step 4: Read site location ID
    const siteLocationId = process.env.DELIVEROO_SITE_LOCATION_ID;

    if (!siteLocationId) {
      return NextResponse.json(
        { error: "DELIVEROO_SITE_LOCATION_ID missing" },
        { status: 500 }
      );
    }

    // Step 5: Compute 7-day date range
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDate = formatDate(sevenDaysAgo);
    const endDate = formatDate(today);

    // Step 6: Build SANDBOX Orders API URL
    const ordersUrl = new URL(
      `https://api-sandbox.developers.deliveroo.com/order/v1/${siteLocationId}/orders`
    );
    ordersUrl.searchParams.set("date", startDate);
    ordersUrl.searchParams.set("date_end", endDate);

    // Step 7: Construct Authorization header
    const authHeader = "Bearer " + accessToken;

    console.log("AUTH HEADER EXACT:", authHeader);
    console.log("ORDERS URL:", ordersUrl.toString());

    // Step 8: Call Orders API
    const ordersRes = await fetch(ordersUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (ordersRes.status < 200 || ordersRes.status >= 300) {
      const rawText = await ordersRes.text();
      return NextResponse.json(
        {
          error: "Orders fetch failed",
          status: ordersRes.status,
          body: rawText,
        },
        { status: 500 }
      );
    }

    // Step 9: Parse and return orders
    const ordersJson = await ordersRes.json();
    console.log("ORDERS RESPONSE:", ordersJson);

    return NextResponse.json(ordersJson);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message || "Unknown error" : "Unknown error",
      },
      { status: 500 }
    );
  }
}
