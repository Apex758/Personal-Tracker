# Personal HQ

A personal Next.js dashboard built around your tracker workbook, but ready to run properly on Vercel with Supabase as the live database.

## What this version is for

This version is designed for:
- one user
- phone + laptop responsive use
- Vercel hosting
- Supabase free tier as the database
- OpenAI insights for suggestions, warnings, and predictions

## Core idea

- The Excel workbook is your **template / backup / import source**
- Supabase is your **real live database**
- Vercel hosts the app
- OpenAI reads module data and gives practical advice

## Why not write back to Excel on Vercel?

Vercel does not work like a normal always-on server with a persistent writable local file system. For a live app where you want to save changes from your phone, a hosted database is the better setup. Vercel can host the app, while Supabase stores the records.

## Current modules

- Finance
- Body & Lifestyle
- Skills & Progress
- Work & Business
- Travel
- Purchases & Wishlist

## Setup

### 1. Install
```bash
npm install
```

### 2. Create a Supabase project
In Supabase:
- create a new project
- open SQL editor
- run `supabase/schema.sql`

### 3. Add environment variables
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 4. Import the workbook into Supabase
```bash
npm run import:xlsx
```

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
Push to GitHub and import the repo into Vercel.
Then add the same environment variables in the Vercel dashboard.

## Demo mode

If Supabase is not configured, the app falls back to demo rows extracted from the workbook.
That lets you preview the dashboard, but saving is disabled until Supabase is connected.

## AI route

`/api/ai/insights` sends module rows to OpenAI and returns:
- observations
- recommendations
- a short-range prediction or warning
- an idea for what to track next

## What to improve next

- add authentication or a private passcode gate
- add edit-in-place instead of quick-add + delete only
- add monthly goals tables
- add budget-vs-actual forecasting
- add reminders and notifications
- add export back to Excel

## Best production setup

For your use case, the best simple stack is:
- Next.js on Vercel
- Supabase free tier database
- OpenAI API for analysis

That is the cleanest option for live saving from your phone.
