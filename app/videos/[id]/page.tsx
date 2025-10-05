import { getSupabaseServer } from "@/lib/supabase-server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const runtime = "nodejs"

export default async function VideoPage({ params }: { params: any }) {
  const supabase = await getSupabaseServer()
  // `params` may be a Promise or object depending on Next setup. Awaiting it
  // handles both cases and gives a consistent typed result.
  const resolvedParams = (await params) as { id: string }
  const videoId = resolvedParams.id

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
  
  // Fetch transcript (if any)
  const { data: transcriptRow } = await supabase
    .from("transcripts")
    .select("*")
    .eq("video_id", videoId)
    .single()

  // Parse transcript JSON into a uniform `entries` array (server-side).
  // The Whisper/Whisker JSON can have multiple shapes; try common keys first,
  // then fall back to a recursive search for an array of objects that look like
  // transcript segments (contain text/content/alternatives/words).
    let transcriptEntries: any[] = []
    if (transcriptRow) {
      try {
        // Primary source: the `segments` jsonb column on the transcripts table
        if (transcriptRow.segments) {
          transcriptEntries = typeof transcriptRow.segments === 'string'
            ? JSON.parse(transcriptRow.segments)
            : transcriptRow.segments
        } else {
          // Fallback: parse `json` column (if present) or try to extract JSON from full_text
          let parsed: any = null
          if (transcriptRow.json) {
            parsed = typeof transcriptRow.json === 'string' ? JSON.parse(transcriptRow.json) : transcriptRow.json
          } else if (typeof transcriptRow.full_text === 'string' && transcriptRow.full_text.trim().startsWith('{') && transcriptRow.full_text.includes('"segments"')) {
            try {
              parsed = JSON.parse(transcriptRow.full_text)
            } catch {
              parsed = null
            }
          }

          if (parsed) {
            transcriptEntries = parsed.segments || parsed.results || parsed.items || parsed.words || []
          }

          // If still empty, recursively search parsed structure for a candidate segments array
          if ((!transcriptEntries || transcriptEntries.length === 0) && parsed) {
            const visited = new Set<any>()
            const looksLikeSegments = (arr: any[]) => {
              if (!Array.isArray(arr) || arr.length === 0) return false
              const sample = arr.slice(0, 5)
              return sample.every((it: any) => !!(it && (it.text || it.content || it.alternatives || it.word || it.words || it.start || it.timestamp)))
            }

            const findArray = (obj: any): any[] | null => {
              if (!obj || visited.has(obj)) return null
              visited.add(obj)
              if (Array.isArray(obj)) {
                if (looksLikeSegments(obj)) return obj
                for (const el of obj) {
                  const found = findArray(el)
                  if (found) return found
                }
                return null
              }
              if (typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                  const found = findArray(obj[key])
                  if (found) return found
                }
              }
              return null
            }

            const found = findArray(parsed)
            if (found) transcriptEntries = found
          }
        }
      } catch {
        transcriptEntries = []
      }
    }

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
            
            {/* Transcript: Prefer whisker/whisper JSON segments (one line per entry). Fallback to full_text. */}
            {transcriptRow && (
              <div>
                <h2 className="text-lg font-semibold mb-2">תמלול</h2>

                {transcriptEntries && transcriptEntries.length > 0 ? (
                  <div className="space-y-2">
                    {transcriptEntries.map((entry: any, idx: number) => {
                      const text = entry.text || entry.content || entry.word || entry.alternatives?.[0]?.content || entry.alternatives?.[0]?.text || ''
                      const start = entry.start ?? entry.start_time ?? entry.timestamp ?? (entry.words && entry.words[0] && entry.words[0].start) ?? null
                      const end = entry.end ?? entry.end_time ?? null

                      const formatTime = (t: number | null) => {
                        if (t == null || Number.isNaN(Number(t))) return ''
                        const seconds = Math.floor(Number(t))
                        const mm = Math.floor(seconds / 60).toString().padStart(2, '0')
                        const ss = (seconds % 60).toString().padStart(2, '0')
                        return `${mm}:${ss}`
                      }

                      return (
                        <div key={idx} className="flex items-start gap-4">
                          <div className="w-20 text-sm text-muted-foreground">{start ? formatTime(start) : ''}{end ? `-${formatTime(end)}` : ''}</div>
                          <div className="prose prose-sm whitespace-pre-wrap">{text}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  transcriptRow.full_text ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{transcriptRow.full_text}</p>
                  ) : (
                    <p className="text-muted-foreground">אין תמלול זמין</p>
                  )
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
