import { getSupabaseServer } from "@/lib/supabase-server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const runtime = "nodejs"

interface VideoPageProps {
  params: {
    id: string
  }
}

export default async function VideoPage({ params }: VideoPageProps) {
  const supabase = await getSupabaseServer()
  const videoId = params.id

  // Fetch video data
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("video_id", videoId)
    .single()

  if (videoError || !video) {
    notFound()
  }

  // Fetch metadata
  const { data: metadata } = await supabase
    .from("video_metadata")
    .select("*")
    .eq("video_id", videoId)
    .single()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "תאריך לא זמין"
    }
  }

  // Build YouTube embed URL from video_id
  // YouTube video_id format: https://www.youtube.com/watch?v=VIDEO_ID
  // Embed format: https://www.youtube.com/embed/VIDEO_ID
  const getEmbedUrl = (url: string) => {
    try {
      // Extract video ID from various YouTube URL formats
      const urlObj = new URL(url)
      let videoId = ""
      
      if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v") || ""
      } else if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1)
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    } catch {
      return null
    }
  }

  const embedUrl = video.url ? getEmbedUrl(video.url) : null

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Back button */}
      <Link href="/videos">
        <Button variant="ghost" className="mb-6">
          <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
          חזרה לרשימת השיעורים
        </Button>
      </Link>

      <div className="space-y-6">
        {/* Video Player */}
        {embedUrl ? (
          <Card className="overflow-hidden">
            <div className="relative w-full aspect-video">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                title={metadata?.subject || video.title || "שיעור הלכה"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center bg-muted">
            <p className="text-muted-foreground">נגן הוידאו אינו זמין</p>
            {video.url && (
              <Button asChild variant="outline" className="mt-4">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  צפה ב-YouTube
                  <ExternalLink className="w-4 h-4 mr-2" />
                </a>
              </Button>
            )}
          </Card>
        )}

        {/* Video Details */}
        <Card className="p-8">
          <div className="space-y-6">
            {/* Title/Subject */}
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {metadata?.subject || video.title || "שיעור הלכה"}
              </h1>
              {metadata?.subject && video.title && video.title !== metadata.subject && (
                <p className="text-xl text-muted-foreground">{video.title}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              {metadata?.hebrew_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">תאריך עברי</p>
                    <p className="text-lg font-medium">{metadata.hebrew_date}</p>
                  </div>
                </div>
              )}
              
              {video.published_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">תאריך פרסום</p>
                    <p className="text-lg font-medium">{formatDate(video.published_at)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">תיאור</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            {/* External Link */}
            {video.url && (
              <div className="pt-4 border-t">
                <Button asChild variant="default" size="lg">
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    פתח ב-YouTube
                    <ExternalLink className="w-4 h-4 mr-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
