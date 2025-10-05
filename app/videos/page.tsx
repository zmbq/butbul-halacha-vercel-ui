import { getSupabaseServer } from "@/lib/supabase-server"
import { VideosList } from "@/components/videos-list"

export const runtime = "nodejs"

const VIDEOS_PER_PAGE = 24

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const supabase = await getSupabaseServer()
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = params.search || ""
  const sortBy = params.sort || "date"
  
  const from = (currentPage - 1) * VIDEOS_PER_PAGE
  const to = from + VIDEOS_PER_PAGE - 1

  // Build the videos query
  let videosQuery = supabase
    .from("videos")
    .select("*", { count: "exact" })

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
        initialSearch={searchQuery}
        initialSort={sortBy}
      />
    </div>
  )
}
