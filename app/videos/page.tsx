import { getSupabaseServer } from "@/lib/supabase-server"
import { VideosList } from "@/components/videos-list"

export const runtime = "nodejs"

const VIDEOS_PER_PAGE = 24

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; subject?: string; sort?: string }
}) {
  const supabase = await getSupabaseServer()
  const currentPage = Number(searchParams.page) || 1
  const searchQuery = searchParams.search || ""
  const selectedSubject = searchParams.subject || "all"
  const sortBy = searchParams.sort || "date"
  
  const from = (currentPage - 1) * VIDEOS_PER_PAGE
  const to = from + VIDEOS_PER_PAGE - 1

  // Build query with filters
  // We need to handle filtering differently since we can't join directly
  
  // If filtering by subject, we need to first get video_ids that match
  let videoIdsToFilter: string[] | null = null
  
  if (selectedSubject !== "all") {
    const { data: metadataForSubject } = await supabase
      .from("video_metadata")
      .select("video_id")
      .eq("subject", selectedSubject)
    
    videoIdsToFilter = metadataForSubject?.map(m => m.video_id) || []
  }
  
  // If searching, we need to get video_ids that match the search in metadata
  if (searchQuery) {
    const { data: metadataForSearch } = await supabase
      .from("video_metadata")
      .select("video_id")
      .or(`subject.ilike.%${searchQuery}%,hebrew_date.ilike.%${searchQuery}%`)
    
    const metadataVideoIds = metadataForSearch?.map(m => m.video_id) || []
    
    // Combine with subject filter if present
    if (videoIdsToFilter !== null) {
      videoIdsToFilter = videoIdsToFilter.filter(id => metadataVideoIds.includes(id))
    } else {
      videoIdsToFilter = metadataVideoIds
    }
  }

  // Build the videos query
  let videosQuery = supabase
    .from("videos")
    .select("*", { count: "exact" })

  // Apply video_id filter if we have one from metadata filtering
  if (videoIdsToFilter !== null) {
    if (videoIdsToFilter.length === 0) {
      // No matches, return empty result
      return (
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">שיעורי הלכה</h1>
            <p className="text-muted-foreground text-lg">0 שיעורים זמינים</p>
          </div>
          <VideosList
            initialVideos={[]}
            currentPage={1}
            totalPages={0}
            totalCount={0}
            availableSubjects={[]}
            initialSearch={searchQuery}
            initialSubject={selectedSubject}
            initialSort={sortBy}
          />
        </div>
      )
    }
    videosQuery = videosQuery.in("video_id", videoIdsToFilter)
  }

  // Apply search filter for video title/description
  if (searchQuery) {
    videosQuery = videosQuery.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  // Apply sorting
  videosQuery = videosQuery.order("published_at", { ascending: false })

  // Get count and execute query with pagination
  const { data: videos, error: videosError, count: totalCount } = await videosQuery.range(from, to)

  if (videosError) {
    console.error("[v0] Error fetching videos:", videosError.message)
  }

  // Fetch metadata for these videos
  const videoIds = videos?.map((v) => v.video_id) || []
  const { data: metadata } = await supabase
    .from("video_metadata")
    .select("*")
    .in("video_id", videoIds)

  // Transform the data structure - combine videos with their metadata
  let videosWithMetadata = videos?.map((video) => ({
    ...video,
    metadata: metadata?.find((m) => m.video_id === video.video_id),
  })) || []

  // Apply client-side sorting by subject if needed
  if (sortBy === "title" && videosWithMetadata.length > 0) {
    videosWithMetadata = videosWithMetadata.sort((a, b) =>
      (a.metadata?.subject || "").localeCompare(b.metadata?.subject || "", "he")
    )
  }

  // Get all unique subjects for the filter dropdown (from all videos, not just current page)
  const { data: allSubjects } = await supabase
    .from("video_metadata")
    .select("subject")
    .not("subject", "is", null)
    .order("subject")

  const uniqueSubjects = Array.from(new Set(allSubjects?.map((s) => s.subject).filter(Boolean) || []))

  const totalPages = totalCount ? Math.ceil(totalCount / VIDEOS_PER_PAGE) : 0

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">שיעורי הלכה</h1>
        <p className="text-muted-foreground text-lg">{totalCount?.toLocaleString("he-IL") || 0} שיעורים זמינים</p>
      </div>

      <VideosList
        initialVideos={videosWithMetadata}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount || 0}
        availableSubjects={uniqueSubjects}
        initialSearch={searchQuery}
        initialSubject={selectedSubject}
        initialSort={sortBy}
      />
    </div>
  )
}
