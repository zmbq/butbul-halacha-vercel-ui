import { getVideos, getVideoMetadata } from "@/lib/db"
import { VideosList } from "@/components/videos-list"

export const runtime = "nodejs"

const VIDEOS_PER_PAGE = 24

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = params.search || ""
  const sortBy = params.sort || "date"
  
  const offset = (currentPage - 1) * VIDEOS_PER_PAGE

  // Fetch videos with direct SQL query
  const { videos, totalCount } = await getVideos({
    search: searchQuery || undefined,
    limit: VIDEOS_PER_PAGE,
    offset,
    orderBy: 'published_at',
    orderDirection: 'desc'
  })

  // Fetch metadata for these videos
  const videoIds = videos?.map((v) => v.video_id) || []
  const metadata = await getVideoMetadata(videoIds)

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
