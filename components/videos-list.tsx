"use client"

import { useState, useEffect, useTransition, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, ExternalLink, ChevronRight, ChevronLeft, Play, Loader2 } from "lucide-react"
import type { HalachaVideo, Tag } from "@/lib/db"

interface VideosListProps {
  initialVideos: HalachaVideo[]
  currentPage: number
  totalPages: number
  totalCount: number
  initialSearch: string
  initialSort: string
  yearTags: Tag[]
  initialYear: string
}

export function VideosList({ 
  initialVideos, 
  currentPage, 
  totalPages, 
  totalCount,
  initialSearch,
  initialSort,
  yearTags,
  initialYear
}: VideosListProps) {
  
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<"date" | "title">(initialSort === "title" ? "title" : "date")
  const [selectedYear, setSelectedYear] = useState(initialYear || " ")
  
  // Use a separate state for the input value to avoid blocking
  const [inputValue, setInputValue] = useState(initialSearch)

  // Apply filters by updating URL params (triggers server-side refetch)
  const applyFilters = useCallback((search: string, sort: string, year: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (sort !== "date") params.set("sort", sort)
    if (year && year !== " ") params.set("year", year)
    params.set("page", "1") // Reset to first page when filtering
    
    startTransition(() => {
      router.push(`/videos?${params.toString()}`)
    })
  }, [router, startTransition])

  // Debounce search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue)
    }, 500)

    return () => clearTimeout(timer)
  }, [inputValue])
  
  // Apply filters when searchQuery or selectedYear changes
  useEffect(() => {
    applyFilters(searchQuery, sortBy, selectedYear)
  }, [searchQuery, sortBy, selectedYear, applyFilters])

  // Handle input change - only update the input value state
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleSortChange = useCallback((value: "date" | "title") => {
    setSortBy(value)
    applyFilters(searchQuery, value, selectedYear)
  }, [searchQuery, selectedYear, applyFilters])

  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(value)
    applyFilters(searchQuery, sortBy, value)
  }, [searchQuery, sortBy, applyFilters])

  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setInputValue("")
    setSortBy("date")
    setSelectedYear(" ")
    startTransition(() => {
      router.push("/videos")
    })
  }, [router, startTransition])

  const formatDate = useCallback((dateString: string) => {
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
  }, [])

  const goToPage = (page: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (sortBy !== "date") params.set("sort", sortBy)
    if (selectedYear && selectedYear !== " ") params.set("year", selectedYear)
    params.set("page", page.toString())
    
    startTransition(() => {
      router.push(`/videos?${params.toString()}`)
    })
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

  // Memoize the expensive videos grid rendering
  const videosGrid = useMemo(() => {
    const result = (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isPending ? 'opacity-60' : 'opacity-100'}`}>
      {initialVideos.map((video) => {
        const formattedDate = (() => {
          try {
            const date = new Date(video.published_at)
            return date.toLocaleDateString("he-IL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          } catch {
            return "תאריך לא זמין"
          }
        })()
        
        return (
        <Link 
          key={video.video_id} 
          href={`/videos/${video.video_id}`}
          className="block transition-transform hover:scale-[1.02]"
        >
          <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full border-2 hover:border-primary/50 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 p-8 flex items-center justify-center border-b border-primary/20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center hover:from-primary/40 hover:to-primary/30 transition-all shadow-md">
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
                    <Calendar className="w-4 h-4 text-accent-foreground" />
                    <span>{video.metadata.hebrew_date}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`tag tag-${tag.type} text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <Play className="w-4 h-4" />
                  <span>צפה בשיעור</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      )})}
    </div>
    )
    return result
  }, [initialVideos, isPending])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 border-primary/10 bg-gradient-to-br from-card via-card to-accent/5">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            {isPending ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              type="text"
              placeholder="חיפוש לפי נושא..."
              value={inputValue}
              onChange={handleSearchChange}
              className="pr-10"
            />
          </div>

          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="כל השנים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">כל השנים</SelectItem>
              {yearTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id.toString()}>
                  {tag.name}
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
        {(searchQuery || (selectedYear && selectedYear !== " ")) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">סינון פעיל:</span>
            {searchQuery && (
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(""); setInputValue("") }} className="h-7 text-xs">
                {searchQuery} ×
              </Button>
            )}
            {selectedYear && selectedYear !== " " && (
              <Button variant="secondary" size="sm" onClick={() => setSelectedYear(" ")} className="h-7 text-xs">
                {yearTags.find(t => t.id.toString() === selectedYear)?.name} ×
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
        <div className="text-sm">
          סה"כ {totalCount.toLocaleString("he-IL")} שיעורים
          {isPending && <Loader2 className="inline-block w-3 h-3 mr-2 animate-spin" />}
        </div>
      </div>

      {/* Videos Grid */}
      {videosGrid}

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
