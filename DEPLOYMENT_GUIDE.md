# OchemPath Deployment Guide

## Quick Deployment to Vercel (Recommended)

### Prerequisites
1. Your code is already on GitHub ✅ (Done!)
2. You have a Supabase project set up
3. You need a Vercel account (free)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. This will automatically connect to your repositories

### Step 2: Deploy from GitHub
1. Click "New Project" in Vercel dashboard
2. Import your repository: `SatyaHMehta/OchemPath`
3. Vercel will auto-detect it's a Next.js app

### Step 3: Add Environment Variables
In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 4: Complete Database Setup
Before testing, run the SQL commands from `ADD_COLUMNS_TO_DATABASE.sql` in your Supabase SQL Editor.

### Step 5: Deploy!
Click "Deploy" - Vercel will:
- Build your app automatically
- Deploy to a live URL
- Give you a shareable link like: `https://ochem-path-xxx.vercel.app`

## Alternative: Netlify Deployment

### Step 1: Connect Repository
1. Go to [netlify.com](https://netlify.com)
2. "New site from Git" → Choose GitHub
3. Select your `OchemPath` repository

### Step 2: Build Settings
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18 or higher

### Step 3: Environment Variables
Add the same Supabase environment variables as above.

## What You'll Get
✅ Live, shareable URL for testing
✅ Automatic deployments on every GitHub push
✅ HTTPS and CDN included
✅ Free hosting for your project

## Testing Checklist
After deployment, test these features:
- [ ] Course page loads and shows published chapters
- [ ] Creator dashboard login works
- [ ] Practice questions interface works
- [ ] Publish/draft functionality works
- [ ] Student practice page shows only published questions

## Next Steps
1. Share the live URL with testers
2. Gather feedback
3. Continue development
4. Auto-deploy updates via GitHub pushes

Let me know if you need help with any of these steps!