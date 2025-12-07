# Vercel Setup Guide

## Initial Setup

1. **Login to Vercel** (if not already logged in):
   ```bash
   vercel login
   ```

2. **Link your project to Vercel**:
   ```bash
   vercel link
   ```
   This will create a `.vercel` directory with your project configuration.

3. **Set Environment Variables**:
   
   You can set environment variables in two ways:
   
   **Option A: Via Vercel Dashboard**
   - Go to your project on [vercel.com](https://vercel.com)
   - Navigate to Settings → Environment Variables
   - Add all variables from `.vercel.env.example`
   
   **Option B: Via Vercel CLI**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add DELIVEROO_CLIENT_ID
   vercel env add DELIVEROO_CLIENT_SECRET
   vercel env add DELIVEROO_MERCHANT_ID
   ```

## Deploy

- **Preview Deployment**:
  ```bash
  vercel
  ```

- **Production Deployment**:
  ```bash
  vercel --prod
  ```

## Environment Variables

All environment variables from `.env.local` should be added to your Vercel project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `DELIVEROO_CLIENT_ID`
- `DELIVEROO_CLIENT_SECRET`
- `DELIVEROO_MERCHANT_ID`

