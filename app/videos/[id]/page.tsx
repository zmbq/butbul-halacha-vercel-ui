import { getVideoById, getVideoMetadataById, getTranscriptionSegments, getVideoTags } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const runtime = "nodejs"

export default async function VideoPage({ params, searchParams }: { 
  params: any
  searchParams: any 
}) {
  // `params` may be a Promise or object depending on Next setup. Awaiting it
  // handles both cases and gives a consistent typed result.
  const resolvedParams = (await params) as { id: string }
  const videoId = resolvedParams.id
  
  // Get search params for highlighting
  const resolvedSearchParams = (await searchParams) as { highlight?: string; t?: string }
  const highlightSegmentId = resolvedSearchParams.highlight ? parseInt(resolvedSearchParams.highlight) : undefined
  const startTime = resolvedSearchParams.t ? parseInt(resolvedSearchParams.t) : undefined

  // Fetch video data
  const video = await getVideoById(videoId)

  if (!video) {
    notFound()
  }

  // Fetch metadata, tags, and transcription segments
  const [metadata, tags, transcriptionSegments] = await Promise.all([
    getVideoMetadataById(videoId),
    getVideoTags(videoId),
    getTranscriptionSegments(videoId)
  ])

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
  
  // Add timestamp to embed URL if provided
  const embedUrlWithTime = embedUrl && startTime 
    ? `${embedUrl}?start=${startTime}&autoplay=1` 
    : embedUrl

  return (
  <div className="w-full mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-full md:max-w-5xl">
      {/* Back button */}
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
          חזרה לרשימת השיעורים
        </Button>
      </Link>

      <div className="space-y-6">
        {/* Video Player */}
        {embedUrlWithTime ? (
          <Card className="overflow-hidden">
              <div className="relative w-full aspect-video">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrlWithTime}
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
        <Card className="p-6 sm:p-8 min-w-0">
            <div className="space-y-6">
            {/* Title/Subject */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 break-words">
                {metadata?.subject || video.title || "שיעור הלכה"}
              </h1>
              {metadata?.subject && video.title && video.title !== metadata.subject && (
                <p className="text-xl text-muted-foreground">{video.title}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadata?.hebrew_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">תאריך עברי</p>
                    <p className="text-lg font-medium">
                      {metadata.day_of_week && `יום ${metadata.day_of_week}, `}
                      {metadata.hebrew_date}
                    </p>
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

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">תגיות</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`tag tag-${tag.type} text-sm px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/20`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">תיאור</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{video.description}</p>
              </div>
            )}
            
            {/* Transcript from transcription_segments table */}
            {transcriptionSegments && transcriptionSegments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">תמלול</h2>
                
                {highlightSegmentId && (
                  <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
                    <p className="text-primary font-medium">
                      גלילה אוטומטית לתוצאת החיפוש המודגשת למטה
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {transcriptionSegments.map((segment) => {
                    const formatTime = (seconds: number) => {
                      const mm = Math.floor(seconds / 60)
                      const ss = Math.floor(seconds % 60).toString().padStart(2, '0')
                      return `${mm}:${ss}`
                    }
                    
                    const isHighlighted = highlightSegmentId === segment.id

                    return (
                      <div 
                        key={segment.id} 
                        id={isHighlighted ? 'highlighted-segment' : undefined}
                        className={`flex items-start gap-4 p-2 rounded transition-colors min-w-0 ${
                          isHighlighted ? 'bg-primary/20 border-2 border-primary shadow-md' : ''
                        }`}
                      >
                        <div className="w-16 sm:w-20 text-sm text-muted-foreground flex-shrink-0">
                          {formatTime(segment.start)}-{formatTime(segment.end)}
                        </div>
                        <div className={`prose prose-sm whitespace-pre-wrap min-w-0 ${
                          isHighlighted ? 'font-medium' : ''
                        }`}>
                          {segment.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {highlightSegmentId && (
                  <script
                    dangerouslySetInnerHTML={{
                      __html: `
                        setTimeout(() => {
                          const element = document.getElementById('highlighted-segment');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 500);
                      `
                    }}
                  />
                )}
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
