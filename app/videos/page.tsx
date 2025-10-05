import { getSupabaseServer } from "@/lib/supabase-server"
import { VideosList } from "@/components/videos-list"

export const runtime = "nodejs"

const VIDEOS_PER_PAGE = 24

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = await getSupabaseServer()
  const currentPage = Number(searchParams.page) || 1
  const from = (currentPage - 1) * VIDEOS_PER_PAGE
  const to = from + VIDEOS_PER_PAGE - 1

  const { count: totalCount } = await supabase.from("videos").select("*", { count: "exact", head: true })

  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to)

  if (videosError) {
    console.error("[v0] Error fetching videos:", videosError.message)
  }

  // Fetch metadata for these videos
  const videoIds = videos?.map((v) => v.video_id) || []
  const { data: metadata, error: metadataError } = await supabase
    .from("video_metadata") // Fixed table name from videos_metadata to video_metadata
    .select("*")
    .in("video_id", videoIds)

  if (metadataError) {
    console.error("[v0] Error fetching metadata:", metadataError.message)
  }

  console.log("[v0] Sample video:", videos?.[0])
  console.log("[v0] Sample metadata:", metadata?.[0])

  const videosWithMetadata = videos?.map((video) => ({
    ...video,
    metadata: metadata?.find((m) => m.video_id === video.video_id),
  }))

  const totalPages = totalCount ? Math.ceil(totalCount / VIDEOS_PER_PAGE) : 0

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">שיעורי הלכה</h1>
        <p className="text-muted-foreground text-lg">{totalCount?.toLocaleString("he-IL") || 0} שיעורים זמינים</p>
      </div>

      <VideosList
        initialVideos={videosWithMetadata || []}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount || 0}
      />
    </div>
  )
}
