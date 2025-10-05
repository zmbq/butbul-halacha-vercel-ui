import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Video, Calendar } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 rounded-3xl -z-10"></div>
        <div className="py-12">
          <h1 className="text-5xl font-bold mb-6 text-balance bg-gradient-to-l from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            הלכה יומית עם הרב בוטבול
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
            ברוכים הבאים לאתר שיעורי ההלכה היומיים של הרב בוטבול. כאן תוכלו למצוא מאגר מקיף של שיעורי הלכה בנושאים שונים,
            עם אפשרות לחיפוש וסינון לפי נושא ותאריך עברי.
          </p>
          <Button asChild size="lg" className="text-lg shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/videos">צפייה בשיעורים</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <Card className="p-6 text-center border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-primary/5">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
              <Video className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-primary">שיעורי וידאו</h3>
          <p className="text-muted-foreground leading-relaxed">מאגר עשיר של שיעורי הלכה מוקלטים באיכות גבוהה</p>
        </Card>

        <Card className="p-6 text-center border-accent/30 hover:border-accent/50 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-accent/10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-accent/30 to-accent/20 rounded-full">
              <BookOpen className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-accent-foreground">תמלול מלא</h3>
          <p className="text-muted-foreground leading-relaxed">כל שיעור מגיע עם תמלול מלא לנוחיותכם</p>
        </Card>

        <Card className="p-6 text-center border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card via-card to-secondary/30">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-secondary/40 to-secondary/30 rounded-full">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-primary">חיפוש וסינון</h3>
          <p className="text-muted-foreground leading-relaxed">מצאו בקלות שיעורים לפי נושא או תאריך עברי</p>
        </Card>
      </section>

      {/* About Section */}
      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">אודות השיעורים</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          הרב בוטבול מעביר מדי יום שיעורי הלכה המתמקדים בנושאים מעשיים ורלוונטיים לחיי היום-יום. השיעורים מוסברים בצורה
          ברורה ומובנת, ומתאימים לכל רמות הידע. האתר מאפשר גישה נוחה לכל השיעורים עם אפשרויות חיפוש וסינון מתקדמות.
        </p>
      </section>
    </div>
  )
}
