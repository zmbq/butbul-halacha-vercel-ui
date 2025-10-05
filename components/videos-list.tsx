"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, ExternalLink, ChevronRight, ChevronLeft, Play } from "lucide-react"
import type { HalachaVideo } from "@/lib/supabase"

interface VideosListProps {
  initialVideos: HalachaVideo[]
  currentPage: number
  totalPages: number
  totalCount: number
  availableSubjects: string[]
  initialSearch: string
  initialSubject: string
  initialSort: string
}

export function VideosList({ 
  initialVideos, 
  currentPage, 
  totalPages, 
  totalCount,
  availableSubjects,
  initialSearch,
  initialSubject,
  initialSort
}: VideosListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<"date" | "title">(initialSort === "title" ? "title" : "date")
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject)

  // Apply filters by updating URL params (triggers server-side refetch)
  const applyFilters = (search: string, subject: string, sort: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (subject !== "all") params.set("subject", subject)
    if (sort !== "date") params.set("sort", sort)
    params.set("page", "1") // Reset to first page when filtering
    
    router.push(`/videos?${params.toString()}`)
  }

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Debounce the actual filter application
    const timer = setTimeout(() => {
      applyFilters(value, selectedSubject, sortBy)
    }, 500)
    return () => clearTimeout(timer)
  }

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value)
    applyFilters(searchQuery, value, sortBy)
  }

  const handleSortChange = (value: "date" | "title") => {
    setSortBy(value)
    applyFilters(searchQuery, selectedSubject, value)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSubject("all")
    setSortBy("date")
    router.push("/videos")
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

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/videos?${params.toString()}`)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = showPages - 1
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - (showPages - 2)
      }

      if (start > 2) pages.push("...")

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) pages.push("...")

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="חיפוש לפי נושא..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Subject Filter */}
          <Select value={selectedSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="בחר נושא" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הנושאים</SelectItem>
              {availableSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => handleSortChange(value as "date" | "title")}>
            <SelectTrigger>
              <SelectValue placeholder="מיין לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">תאריך</SelectItem>
              <SelectItem value="title">נושא</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters display */}
        {(searchQuery || selectedSubject !== "all") && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">סינון פעיל:</span>
            {searchQuery && (
              <Button variant="secondary" size="sm" onClick={clearFilters} className="h-7 text-xs">
                {searchQuery} ×
              </Button>
            )}
            {selectedSubject !== "all" && (
              <Button variant="secondary" size="sm" onClick={clearFilters} className="h-7 text-xs">
                {selectedSubject} ×
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
            >
              נקה הכל
            </Button>
          </div>
        )}
      </Card>

      {/* Results count and page info */}
      <div className="flex items-center justify-between text-muted-foreground">
        <div>
          מציג {initialVideos.length} שיעורים בעמוד {currentPage} מתוך {totalPages}
        </div>
        <div className="text-sm">סה"כ {totalCount.toLocaleString("he-IL")} שיעורים</div>
      </div>

      {/* Videos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialVideos.map((video) => (
          <Link 
            key={video.video_id} 
            href={`/videos/${video.video_id}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full border-2 hover:border-primary/50">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center border-b">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Play className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] hover:text-primary transition-colors">
                  {video.metadata?.subject || video.title || "שיעור הלכה"}
                </h3>

                <div className="space-y-2">
                  {video.metadata?.hebrew_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{video.metadata.hebrew_date}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(video.published_at)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <Play className="w-4 h-4" />
                    <span>צפה בשיעור</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* No results */}
      {initialVideos.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">לא נמצאו שיעורים התואמים את החיפוש</p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mt-4"
          >
            נקה סינונים
          </Button>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) =>
                typeof page === "number" ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-2 text-muted-foreground">
                    {page}
                  </span>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
