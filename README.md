# butbul-halacha-vercel-ui

A Next.js application for managing and displaying Halacha videos, powered by Supabase.

## Prerequisites

- Node.js 18.x or higher
- pnpm (or npm/yarn)
- A Supabase project

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

The project requires Supabase credentials. A `.env.local` file has been created for you.

Edit `.env.local` and add your Supabase credentials:

```env
# Server-side Supabase credentials (recommended for Vercel deployment)
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

**To find your Supabase credentials:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the `Project URL` and `anon/public key`

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint

## Tech Stack

- **Framework:** Next.js 15.2
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **Deployment:** Vercel

## Project Structure

- `/app` - Next.js app directory with pages and layouts
- `/components` - React components (UI and feature components)
- `/lib` - Utility functions and Supabase clients
- `/public` - Static assets
- `/styles` - Global styles