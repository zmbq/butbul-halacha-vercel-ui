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
  trigger?: SearchMatch
}

// Weights for combining different signal types. Tweak these to experiment.
const TRIGRAM_WEIGHT = 1.0
const ILIKE_WEIGHT = 0.6
const EMBEDDING_WEIGHT = 2.0

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
}): Promise<{ results: SearchResult[]; queryVector?: number[] }> {
  const { limit = 50, minSimilarity = 0.1 } = options || {}
  
  if (!searchQuery || searchQuery.trim().length === 0) {
    return { results: [], queryVector: undefined }
  }

  // We'll try to augment the text-based search with vector embeddings when an
  // OpenAI key is available. If no key is present or an error happens, we
  // gracefully fall back to the text-only search (existing behavior).
  const openAiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

  // Use module-level constants for weights. These are the single source of
  // truth for tuning and must be changed in this file (not via API).
  const TRIGRAM = TRIGRAM_WEIGHT
  const ILIKE = ILIKE_WEIGHT
  const EMBED = EMBEDDING_WEIGHT

  let vector: number[] | null = null
  if (openAiKey) {
    try {
      // Use the small embedding model; change model name if you prefer another one.
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({ input: searchQuery, model: 'text-embedding-3-small' }),
      })

      if (res.ok) {
        const data = await res.json()
        // Defensive access to the embedding vector
        if (data && data.data && Array.isArray(data.data) && data.data[0] && Array.isArray(data.data[0].embedding)) {
          vector = data.data[0].embedding
        }
      } else {
        // Non-fatal: log and continue with text-only search
        console.warn('OpenAI embeddings request failed', await res.text())
      }
    } catch (err) {
      console.warn('OpenAI embeddings error:', err)
      vector = null
    }
  }

  // If we have a vector, Postgres pgvector expects a literal like '[0.1,0.2,...]'
  // when passed as a parameter cast to ::vector. Convert the JS array to that
  // string form here. If vector is null this will remain null.
  const vectorParam = vector ? '[' + vector.join(',') + ']' : null

  // If we failed to obtain a vector, and the caller requested embedding-only
  // behavior, return empty results (we're disabling ILIKE/pg_trgm for now).
  if (!vector) {
    return { results: [], queryVector: undefined }
  }

  // If we have a vector, include an embedding-based score into the SQL and
  // compute a combined ranking score. This assumes your `embeddings_cache`
  // table has a pgvector column named `vector`. If your column is named
  // differently, change `ec.vector` below. We convert a vector distance
  // to a similarity-like score with `1 / (1 + distance)` so larger is better.
  // NOTE: this SQL uses the pgvector `<->` operator (Euclidean distance).
  // Vector-only nearest neighbor search: find the closest cache rows by
  // vector distance, then join to embeddings to map to videos and
  // transcription chunks. We fetch more cache rows (nearestLimit) to
  // increase the chance of covering enough videos, then group by video.
  const nearestLimit = Math.max(200, limit * 20)

  const searchResults = await query<{
    video_id: string
    match_type: 'transcription'
    cache_text: string
    distance: number
    segment_id: number | null
    start_time: number | null
    end_time: number | null
  }>(
    `
    WITH nearest AS (
      SELECT ec.id as cache_id, ec.text as cache_text, (ec.vector <-> $1::vector) as distance
      FROM embeddings_cache ec
      WHERE ec.vector IS NOT NULL
      ORDER BY distance ASC
      LIMIT $2::int
    )
    SELECT e.video_id, 'transcription' as match_type, n.cache_text, n.distance, tc.first_segment_id as segment_id, tc.start as start_time, tc.end as end_time
    FROM nearest n
    INNER JOIN embeddings e ON e.source_cache_id = n.cache_id
    INNER JOIN transcription_chunks tc ON tc.id = e.transcription_chunk_id
    WHERE e.transcription_chunk_id IS NOT NULL
    ORDER BY n.distance ASC
    LIMIT $3::int
    `,
    // params: vectorParam, nearestLimit, limit
    [vectorParam, nearestLimit, limit]
  )

  // Group results by video_id
  const videoMatchesMap = new Map<string, SearchMatch[]>()

  // Build min/max distance across the returned candidate rows so we can
  // normalize distances into a 0..1 similarity score. This spreads values
  // across the results instead of collapsing around ~0.5 for typical
  // Euclidean distances.
  const distances = searchResults.map(r => typeof (r as any).distance === 'number' ? (r as any).distance : Infinity)
  const minDist = distances.length > 0 ? Math.min(...distances) : 0
  const maxDist = distances.length > 0 ? Math.max(...distances) : 0

  for (const row of searchResults) {
    if (!videoMatchesMap.has(row.video_id)) {
      videoMatchesMap.set(row.video_id, [])
    }

    // Normalize distance into 0..1 similarity where smaller distance ->
    // higher similarity. If all distances are equal, fall back to 1.0.
    let similarity = 0
    if (typeof (row as any).distance === 'number') {
      const d = (row as any).distance
      if (maxDist === minDist) {
        similarity = 1
      } else {
        // invert so smaller distance => larger similarity
        similarity = 1 - ((d - minDist) / (maxDist - minDist))
        // clamp
        if (similarity < 0) similarity = 0
        if (similarity > 1) similarity = 1
      }
    }

    videoMatchesMap.get(row.video_id)!.push({
      type: row.match_type,
      text: row.cache_text,
      similarity,
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
    // Choose a trigger match: prefer the first transcription match, else first match
    trigger: matches.find(m => m.type === 'transcription') || matches[0]
  }))

  // Sort by max similarity and limit
  results.sort((a, b) => b.max_similarity - a.max_similarity)

  return { results: results.slice(0, limit), queryVector: vector || undefined }
}

// Close the pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
