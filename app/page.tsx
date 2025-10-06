import { getVideos, getVideoMetadata, getYearTags, getManualTags, getVideosTagsMap } from "@/lib/db"
import { VideosList } from "@/components/videos-list"

export const runtime = "nodejs"

const VIDEOS_PER_PAGE = 24

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; year?: string; tags?: string }>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = params.search || ""
  const yearTagId = params.year ? Number(params.year) : undefined
  const manualTagIdsParam = params.tags || ""
  const manualTagIds = manualTagIdsParam ? manualTagIdsParam.split(',').map(Number).filter(n => !isNaN(n)) : []
  
  const offset = (currentPage - 1) * VIDEOS_PER_PAGE

  // Fetch year tags and manual tags for the dropdowns
  const [yearTags, manualTags] = await Promise.all([
    getYearTags(),
    getManualTags()
  ])

  // Fetch videos with direct SQL query - always sort by date descending
  const { videos, totalCount } = await getVideos({
    search: searchQuery || undefined,
    limit: VIDEOS_PER_PAGE,
    offset,
    orderBy: 'published_at',
    orderDirection: 'desc',
    yearTagId,
    manualTagIds: manualTagIds.length > 0 ? manualTagIds : undefined
  })

  // Fetch metadata for these videos
  const videoIds = videos?.map((v) => v.video_id) || []
  const metadata = await getVideoMetadata(videoIds)
  
  // Fetch tags for these videos
  const tagsMap = await getVideosTagsMap(videoIds)

  // Transform the data structure - combine videos with their metadata and tags
  const videosWithMetadata = videos?.map((video) => ({
    ...video,
    metadata: metadata?.find((m) => m.video_id === video.video_id),
    tags: tagsMap.get(video.video_id) || [],
  })) || []

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
        initialSort="date"
        yearTags={yearTags}
        initialYear={yearTagId?.toString() || ""}
        manualTags={manualTags}
        initialManualTagIds={manualTagIds}
      />
    </div>
  )
}
