import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost">
            <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
            חזרה לשיעורים
          </Button>
        </Link>

        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-l from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            אודות האתר
          </h1>
        </div>

        {/* Placeholder Content Card */}
        <Card className="p-12 text-center bg-gradient-to-br from-card via-card to-primary/5">
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">
                בקרוב - מידע אודות האתר
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                דף זה יכלול מידע מפורט אודות האתר, מטרותיו, והאופן בו הוא נבנה.
                המידע יתווסף בקרוב.
              </p>
            </div>
          </div>
        </Card>

        {/* Additional placeholder sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-primary/20 hover:border-primary/40 transition-all">
            <h3 className="text-xl font-bold mb-3 text-primary">על הפרוייקט</h3>
            <p className="text-muted-foreground leading-relaxed">
              מידע אודות הפרוייקט יתווסף בהמשך...
            </p>
          </Card>

          <Card className="p-6 border-primary/20 hover:border-primary/40 transition-all">
            <h3 className="text-xl font-bold mb-3 text-primary">צור קשר</h3>
            <p className="text-muted-foreground leading-relaxed">
              פרטי יצירת קשר יתווספו בהמשך...
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
