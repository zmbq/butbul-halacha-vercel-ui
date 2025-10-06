# butbul-halacha-vercel-ui

A Next.js application for managing and displaying Halacha videos, with direct PostgreSQL database access.

## Prerequisites

- Node.js 18.x or higher
- npm (or pnpm/yarn)
- A PostgreSQL database

## Local Development Setup

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

The project requires a PostgreSQL connection string. Create a `.env.local` file in the root directory:

```env
# PostgreSQL Database Connection
# Format: postgresql://username:password@host:port/database
POSTGRES_URL=postgresql://user:password@localhost:5432/halacha_db

# Alternative name (both are supported)
# DATABASE_URL=postgresql://user:password@localhost:5432/halacha_db
```

**Example for Supabase (using direct PostgreSQL connection):**

```env
POSTGRES_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework:** Next.js 15.2
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (direct connection via node-postgres)
- **Deployment:** Vercel

## Database Access

This application uses direct PostgreSQL connections instead of PostgREST API. This enables:

- **Fuzzy search capabilities** - Custom SQL queries with trigram search
- **Vector embeddings** - Support for pgvector and semantic search
- **Complex queries** - Full SQL flexibility for advanced features
- **Better performance** - Optimized queries without API overhead

### Database Module (`lib/db.ts`)

The database module provides:

- Connection pooling for efficient database access
- Helper functions for common queries
- Type-safe interfaces for database entities
- Support for:
  - Videos listing with pagination and search
  - Video metadata and transcripts
  - Custom SQL queries for advanced features

### Adding Custom Queries

You can add custom queries to `lib/db.ts`:

```typescript
export async function customQuery() {
  return query('SELECT * FROM your_table WHERE ...', [params])
}
```

## Project Structure

- `/app` - Next.js app directory with pages and layouts
- `/components` - React components (UI and feature components)
- `/lib` - Utility functions and database client
  - `db.ts` - PostgreSQL connection and query functions
- `/public` - Static assets
- `/styles` - Global styles