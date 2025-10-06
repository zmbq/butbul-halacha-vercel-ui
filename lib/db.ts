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
  tags?: Tag[]
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

export interface Tag {
  id: number
  name: string
  type: string
  created_at: string
  updated_at: string
}

export interface Tagging {
  id: number
  video_id: string
  tag_id: number
  created_at: string
  updated_at: string
}

export interface SearchMatch {
  type: 'subject' | 'transcription'
  text: string
  similarity: number
  segment_id?: number
  start_time?: number
  end_time?: number
}

export interface SearchResult {
  video_id: string
  matches: SearchMatch[]
  max_similarity: number
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
  yearTagId?: number
  manualTagIds?: number[]
}): Promise<{ videos: any[], totalCount: number }> {
  const { search, limit = 24, offset = 0, orderBy = 'published_at', orderDirection = 'desc', yearTagId, manualTagIds } = options

  let countQuery = 'SELECT COUNT(DISTINCT v.video_id) FROM videos v'
  let selectQuery = 'SELECT DISTINCT v.* FROM videos v'
  const params: any[] = []
  let paramIndex = 1
  const conditions: string[] = []
  const joins: string[] = []

  // Add year filter via taggings table
  if (yearTagId) {
    joins.push(`INNER JOIN taggings t_year ON v.video_id = t_year.video_id AND t_year.tag_id = $${paramIndex}`)
    params.push(yearTagId)
    paramIndex++
  }

  // Add manual tags filter - videos must have ALL selected manual tags
  if (manualTagIds && manualTagIds.length > 0) {
    for (let i = 0; i < manualTagIds.length; i++) {
      joins.push(`INNER JOIN taggings t_manual_${i} ON v.video_id = t_manual_${i}.video_id AND t_manual_${i}.tag_id = $${paramIndex}`)
      params.push(manualTagIds[i])
      paramIndex++
    }
  }

  // Add join for metadata (needed for search)
  if (search) {
    joins.push(`LEFT JOIN video_metadata vm ON v.video_id = vm.video_id`)
  }

  // Add joins to queries
  const joinClause = joins.length > 0 ? ' ' + joins.join(' ') : ''
  countQuery += joinClause
  selectQuery += joinClause

  // Add search filter - only search in subject field from video_metadata
  if (search) {
    conditions.push(`vm.subject ILIKE $${paramIndex}`)
    params.push(`%${search}%`)
    paramIndex++
  }

  // Add WHERE clause if there are conditions
  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ')
    countQuery += whereClause
    selectQuery += whereClause
  }

  // Add ordering and pagination
  selectQuery += ` ORDER BY v.${orderBy} ${orderDirection.toUpperCase()}`
  selectQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)

  // Execute count query with appropriate params (without limit/offset)
  const countParams = params.slice(0, -2)
  
  // Execute queries
  const [countResult, videos] = await Promise.all([
    queryOne<{ count: string }>(countQuery, countParams),
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

export async function getYearTags(): Promise<Tag[]> {
  return query<Tag>(
    `SELECT * FROM tags WHERE type = 'date' ORDER BY name DESC`,
    []
  )
}

export async function getManualTags(): Promise<Tag[]> {
  return query<Tag>(
    `SELECT * FROM tags WHERE type = 'manual' ORDER BY name ASC`,
    []
  )
}

export async function getVideoTags(videoId: string): Promise<Tag[]> {
  return query<Tag>(
    `SELECT t.* FROM tags t
     INNER JOIN taggings tg ON t.id = tg.tag_id
     WHERE tg.video_id = $1
     ORDER BY t.type, t.name`,
    [videoId]
  )
}

export async function getVideosTagsMap(videoIds: string[]): Promise<Map<string, Tag[]>> {
  if (videoIds.length === 0) return new Map()
  
  const rows = await query<Tag & { video_id: string }>(
    `SELECT t.*, tg.video_id FROM tags t
     INNER JOIN taggings tg ON t.id = tg.tag_id
     WHERE tg.video_id = ANY($1)
     ORDER BY t.type, t.name`,
    [videoIds]
  )
  
  const tagsMap = new Map<string, Tag[]>()
  for (const row of rows) {
    const videoId = row.video_id
    if (!tagsMap.has(videoId)) {
      tagsMap.set(videoId, [])
    }
    // Remove video_id from the tag object before adding
    const { video_id, ...tag } = row
    tagsMap.get(videoId)!.push(tag as Tag)
  }
  
  return tagsMap
}

// Advanced search using embeddings_cache and pg_trgm similarity
export async function advancedSearchVideos(searchQuery: string, options?: {
  limit?: number
  minSimilarity?: number
}): Promise<SearchResult[]> {
  const { limit = 50, minSimilarity = 0.1 } = options || {}
  
  if (!searchQuery || searchQuery.trim().length === 0) {
    return []
  }

  // Search in embeddings_cache using both ILIKE and similarity
  // Join with embeddings to get video_id and transcription_segment_id
  // Group by video to aggregate matches
  const searchResults = await query<{
    video_id: string
    match_type: 'subject' | 'transcription'
    cache_text: string
    similarity: number
    segment_id: number | null
    start_time: number | null
    end_time: number | null
  }>(
    `
    WITH matching_cache AS (
      SELECT 
        ec.id as cache_id,
        ec.text as cache_text,
        SIMILARITY(ec.text, $1) as similarity
      FROM embeddings_cache ec
      WHERE ec.text ILIKE $2
         OR SIMILARITY(ec.text, $1) > $3
    ),
    subject_matches AS (
      SELECT 
        e.video_id,
        'subject' as match_type,
        mc.cache_text,
        mc.similarity,
        NULL::integer as segment_id,
        NULL::numeric as start_time,
        NULL::numeric as end_time
      FROM matching_cache mc
      INNER JOIN embeddings e ON e.source_cache_id = mc.cache_id
      WHERE e.transcription_chunk_id IS NULL
    ),
    transcription_matches AS (
      SELECT 
        e.video_id,
        'transcription' as match_type,
        mc.cache_text,
        mc.similarity,
        tc.first_segment_id as segment_id,
        tc.start as start_time,
        tc.end as end_time
      FROM matching_cache mc
      INNER JOIN embeddings e ON e.source_cache_id = mc.cache_id
      INNER JOIN transcription_chunks tc ON tc.id = e.transcription_chunk_id
    )
    SELECT * FROM subject_matches
    UNION ALL
    SELECT * FROM transcription_matches
    ORDER BY similarity DESC
    LIMIT $4
    `,
    [searchQuery, `%${searchQuery}%`, minSimilarity, limit * 5] // Get more matches to group by video
  )

  // Group results by video_id
  const videoMatchesMap = new Map<string, SearchMatch[]>()
  
  for (const row of searchResults) {
    if (!videoMatchesMap.has(row.video_id)) {
      videoMatchesMap.set(row.video_id, [])
    }
    
    videoMatchesMap.get(row.video_id)!.push({
      type: row.match_type,
      text: row.cache_text,
      similarity: row.similarity,
      segment_id: row.segment_id || undefined,
      start_time: row.start_time || undefined,
      end_time: row.end_time || undefined,
    })
  }

  // Convert to SearchResult array and calculate max similarity per video
  const results: SearchResult[] = Array.from(videoMatchesMap.entries()).map(([video_id, matches]) => ({
    video_id,
    matches,
    max_similarity: Math.max(...matches.map(m => m.similarity)),
  }))

  // Sort by max similarity and limit
  results.sort((a, b) => b.max_similarity - a.max_similarity)
  
  return results.slice(0, limit)
}

// Close the pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
