import { Pool } from 'pg'

// Type definitions
export interface HalachaVideo {
  video_id: string
  url: string
  title: string
  description: string
  published_at: string
  created_at: string
  updated_at: string
  duration_seconds: number
  transcript?: any
  metadata?: {
    video_id: string
    hebrew_date: string
    subject: string
    day_of_week: string
    created_at: string
    updated_at: string
  }
}

export interface VideoMetadata {
  video_id: string
  hebrew_date: string
  subject: string
  day_of_week: string
  created_at: string
  updated_at: string
}

export interface Transcript {
  video_id: string
  full_text: string
  segments: any
  json: any
  created_at: string
  updated_at: string
}

export interface TranscriptionSegment {
  id: number
  video_id: string
  source: string
  segment_index: number
  start: number
  duration: number
  end: number
  text: string
  raw: any
  created_at: string
  updated_at: string
}

// Create a singleton pool instance
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL || 
      process.env.NEXT_PUBLIC_POSTGRES_URL || 
      process.env.NEXT_PUBLIC_DATABASE_URL
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL, DATABASE_URL, NEXT_PUBLIC_POSTGRES_URL, or NEXT_PUBLIC_DATABASE_URL environment variable is required')
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  return pool
}

// Helper function to execute queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const client = await pool.connect()
  
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

// Helper function to execute a query and return a single row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

// Video-specific query functions
export async function getVideos(options: {
  search?: string
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}): Promise<{ videos: any[], totalCount: number }> {
  const { search, limit = 24, offset = 0, orderBy = 'published_at', orderDirection = 'desc' } = options

  let countQuery = 'SELECT COUNT(*) FROM videos'
  let selectQuery = 'SELECT * FROM videos'
  const params: any[] = []
  let paramIndex = 1

  // Add search filter
  if (search) {
    const searchCondition = ` WHERE title ILIKE $${paramIndex} OR description ILIKE $${paramIndex}`
    countQuery += searchCondition
    selectQuery += searchCondition
    params.push(`%${search}%`)
    paramIndex++
  }

  // Add ordering and pagination
  selectQuery += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`
  selectQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)

  // Execute queries
  const [countResult, videos] = await Promise.all([
    queryOne<{ count: string }>(countQuery, search ? [params[0]] : []),
    query(selectQuery, params)
  ])

  const totalCount = countResult ? parseInt(countResult.count, 10) : 0

  return { videos, totalCount }
}

export async function getVideoById(videoId: string): Promise<any | null> {
  return queryOne(
    'SELECT * FROM videos WHERE video_id = $1',
    [videoId]
  )
}

export async function getVideoMetadata(videoIds: string[]): Promise<VideoMetadata[]> {
  if (videoIds.length === 0) return []
  
  return query<VideoMetadata>(
    'SELECT * FROM video_metadata WHERE video_id = ANY($1)',
    [videoIds]
  )
}

export async function getVideoMetadataById(videoId: string): Promise<VideoMetadata | null> {
  return queryOne<VideoMetadata>(
    'SELECT * FROM video_metadata WHERE video_id = $1',
    [videoId]
  )
}

export async function getTranscript(videoId: string): Promise<Transcript | null> {
  return queryOne<Transcript>(
    'SELECT * FROM transcripts WHERE video_id = $1',
    [videoId]
  )
}

export async function getTranscriptionSegments(videoId: string): Promise<TranscriptionSegment[]> {
  return query<TranscriptionSegment>(
    'SELECT * FROM transcription_segments WHERE video_id = $1 ORDER BY segment_index ASC',
    [videoId]
  )
}

// Close the pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
