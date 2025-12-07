import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Step 1: Get OAuth access token
    const authBody = new URLSearchParams({
      client_id: process.env.DELIVEROO_CLIENT_ID || '',
      client_secret: process.env.DELIVEROO_CLIENT_SECRET || '',
      grant_type: 'client_credentials',
    });

    const authResponse = await fetch('https://auth-sandbox.developers.deliveroo.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: authBody.toString(),
    });

    if (authResponse.status < 200 || authResponse.status >= 300) {
      const rawAuthText = await authResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch brands/sites',
          status: authResponse.status,
          body: rawAuthText,
        },
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token?.trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Failed to fetch brands/sites',
          status: 500,
          body: 'No access token received from OAuth',
        },
        { status: 500 }
      );
    }

    // Step 2: Get brands
    const brandsResponse = await fetch('https://api.developers.deliveroo.com/site/v2/brands', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (brandsResponse.status < 200 || brandsResponse.status >= 300) {
      const rawBrandsText = await brandsResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch brands/sites',
          status: brandsResponse.status,
          body: rawBrandsText,
        },
        { status: 500 }
      );
    }

    const brands = await brandsResponse.json();

    // Step 3: Check if brands exist and get first brand's ID
    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return NextResponse.json(
        {
          error: 'No brands found for this account',
        },
        { status: 500 }
      );
    }

    const brandId = brands[0].id;

    // Step 4: Get sites for the first brand
    const sitesResponse = await fetch(
      `https://api.developers.deliveroo.com/site/v2/brand/${brandId}/sites`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (sitesResponse.status < 200 || sitesResponse.status >= 300) {
      const rawSitesText = await sitesResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch brands/sites',
          status: sitesResponse.status,
          body: rawSitesText,
        },
        { status: 500 }
      );
    }

    const sites = await sitesResponse.json();

    // Step 5: Return both brands and sites
    return NextResponse.json({
      brands: brands,
      sites: sites,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message || 'Unknown error' : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
