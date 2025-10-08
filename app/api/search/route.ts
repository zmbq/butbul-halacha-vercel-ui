import { NextRequest, NextResponse } from 'next/server'
import { advancedSearchVideos, getVideoMetadata, getVideosTagsMap } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '50')
  const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.1')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 })
    }

    // Perform advanced search
    const { results: searchResults, queryVector } = await advancedSearchVideos(query, {
      limit,
      minSimilarity,
    })

    // Get video metadata and tags for the results
    const videoIds = searchResults.map(r => r.video_id)
    const [metadata, tagsMap] = await Promise.all([
      getVideoMetadata(videoIds),
      getVideosTagsMap(videoIds)
    ])

    // Combine search results with metadata
    const enrichedResults = searchResults.map(result => {
      const videoMetadata = metadata.find(m => m.video_id === result.video_id)
      const tags = tagsMap.get(result.video_id) || []
      
      return {
        video_id: result.video_id,
        subject: videoMetadata?.subject,
        hebrew_date: videoMetadata?.hebrew_date,
        day_of_week: videoMetadata?.day_of_week,
        tags,
        matches: result.matches,
        max_similarity: result.max_similarity,
        trigger: result.trigger
      }
    })

    return NextResponse.json({
      results: enrichedResults,
      total: enrichedResults.length,
      query,
      queryVector
    })

  } catch (error) {
    console.error('Advanced search error:', error)
    return NextResponse.json({ 
      error: 'Failed to perform search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
