export interface HalachaVideo {
  video_id: string
  url: string
  title: string // This is the subject/lesson title
  description: string
  published_at: string // ISO date string
  created_at: string
  updated_at: string
  duration_seconds: number
  transcript?: any // JSON from Whisper API (if available)
  metadata?: {
    video_id: string
    hebrew_date: string
    subject: string
    day_of_week: string
    created_at: string
    updated_at: string
  }
}
