import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="p-12 text-center">
        <h1 className="text-4xl font-bold mb-4">שיעור לא נמצא</h1>
        <p className="text-muted-foreground text-lg mb-8">
          השיעור שחיפשת אינו קיים או הוסר מהמערכת
        </p>
        <Link href="/">
          <Button variant="default" size="lg">
            <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
            חזרה לרשימת השיעורים
          </Button>
        </Link>
      </Card>
    </div>
  )
}
