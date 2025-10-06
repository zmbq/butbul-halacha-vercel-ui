# Search Implementation Summary

## Overview
The application now supports two search modes:

### 1. **Basic Search** (Auto-triggered)
- **Trigger**: Automatically as user types (with 500ms debounce)
- **Search Scope**: Only searches in the `video_metadata.subject` field
- **Implementation**: Direct SQL query with ILIKE pattern matching
- **Use Case**: Quick filtering by video subject/topic

### 2. **Advanced Search** (Button-triggered)
- **Trigger**: User clicks "חיפוש מתקדם" (Advanced Search) button
- **Search Scope**: Searches in both:
  - Video subjects (from `video_metadata` via `embeddings_cache`)
  - Transcription segments (from `transcription_segments` via `embeddings_cache`)
- **Technology**: PostgreSQL pg_trgm similarity + ILIKE pattern matching
- **Features**:
  - Returns similarity scores for each match
  - Groups results by video
  - Shows match type (subject vs transcription)
  - Provides clickable links that jump to specific transcription segments

## Changes Made

### 1. Database Layer (`lib/db.ts`)

#### Updated Basic Search
```typescript
// Modified getVideos() to search only in subject field
if (search) {
  joins.push(`LEFT JOIN video_metadata vm ON v.video_id = vm.video_id`)
  conditions.push(`vm.subject ILIKE $${paramIndex}`)
}
```

#### Added Search Types
```typescript
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
```

#### Added Advanced Search Function
```typescript
export async function advancedSearchVideos(searchQuery: string, options?: {
  limit?: number
  minSimilarity?: number
}): Promise<SearchResult[]>
```

This function:
- Searches `embeddings_cache` table using ILIKE and SIMILARITY()
- Joins with `embeddings` table to get video_id and segment info
- Separates subject matches (no segment_id) from transcription matches
- Groups results by video and calculates max similarity
- Returns up to `limit` videos sorted by similarity

### 2. API Route (`app/api/search/route.ts`)

Created new API endpoint `/api/search` that:
- Accepts query parameter `q` for search text
- Optional parameters: `limit` (default 50) and `minSimilarity` (default 0.1)
- Calls `advancedSearchVideos()` function
- Enriches results with video metadata and tags
- Returns JSON response with results

### 3. UI Component (`components/videos-list.tsx`)

#### Layout Changes
- Reorganized filter grid to accommodate search button
- Search input now in column 1
- Advanced search button in column 2
- Year filter in column 3
- Manual tags filter moved to second row

#### New State Management
```typescript
const [advancedSearchResults, setAdvancedSearchResults] = useState<AdvancedSearchResult[] | null>(null)
const [isAdvancedSearching, setIsAdvancedSearching] = useState(false)
const [advancedSearchQuery, setAdvancedSearchQuery] = useState("")
```

#### Advanced Search Handler
```typescript
const handleAdvancedSearch = async () => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(inputValue)}`)
  const data = await response.json()
  setAdvancedSearchResults(data.results || [])
}
```

#### Advanced Results Display
- Shows results in expandable card section
- Displays match types (subject vs transcription)
- Shows similarity percentages
- Previews first transcription match
- Links to video page with timestamp and highlight parameters

### 4. Video Detail Page (`app/videos/[id]/page.tsx`)

#### Search Params Support
```typescript
const resolvedSearchParams = (await searchParams) as { 
  highlight?: string  // Segment ID to highlight
  t?: string          // Start time in seconds
}
```

#### Video Player Enhancement
- Adds `?start={time}&autoplay=1` to YouTube embed URL when timestamp provided
- Starts video at exact moment of search match

#### Transcript Highlighting
- Highlights the matching transcription segment with:
  - Primary background color
  - Border and shadow
  - Bold text
- Auto-scrolls to highlighted segment on page load
- Shows notification banner when highlight is active

## Database Schema Requirements

The implementation assumes the following database structure:

### Required Tables
1. **embeddings_cache**: Text storage with GIN index
   - `id`: Primary key
   - `text`: The actual text (has GIN index for pg_trgm)

2. **embeddings**: Links cache entries to videos/segments
   - `embeddings_cache_id`: FK to embeddings_cache
   - `video_id`: FK to videos
   - `transcription_segment_id`: FK to transcription_segments (nullable)

3. **video_metadata**
   - `video_id`: FK to videos
   - `subject`: Hebrew subject/title
   - `hebrew_date`, `day_of_week`: Date information

4. **transcription_segments**
   - `id`: Primary key
   - `video_id`: FK to videos
   - `start`, `end`: Time in seconds
   - `text`: Segment text

### Required PostgreSQL Extension
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## User Experience Flow

### Basic Search Flow
1. User types in search box
2. After 500ms of no typing, basic search triggers
3. Results filter automatically by subject match
4. Standard video grid displays filtered results

### Advanced Search Flow
1. User types search query
2. User clicks "חיפוש מתקדם" button
3. Loading state shows during API call
4. Advanced results section appears above video grid
5. Results show:
   - Subject matches with similarity %
   - Transcription matches with preview and time
   - Video metadata and tags
6. User clicks on result
7. Video page opens with:
   - Video player starting at matched timestamp
   - Highlighted transcription segment
   - Auto-scroll to highlighted segment

## Future Enhancements

Potential improvements:
1. Add vector similarity search for semantic matching (when embeddings are generated)
2. Support for multiple language searches
3. Filter advanced results by similarity threshold
4. Export search results
5. Search history and suggestions
6. Highlighting multiple matches in transcription
7. Click-to-play from any transcription segment

## Testing Checklist

- [x] Basic search filters videos by subject
- [x] Advanced search button triggers API call
- [x] Advanced search returns results from both subject and transcription
- [x] Search results display with proper metadata
- [x] Clicking transcription match navigates to video
- [x] Video player starts at correct timestamp
- [x] Transcription segment highlights correctly
- [x] Auto-scroll to highlighted segment works
- [x] Clear filters resets both search modes
