import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Video, Calendar } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 text-balance">הלכה יומית עם הרב בוטבול</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
          ברוכים הבאים לאתר שיעורי ההלכה היומיים של הרב בוטבול. כאן תוכלו למצוא מאגר מקיף של שיעורי הלכה בנושאים שונים,
          עם אפשרות לחיפוש וסינון לפי נושא ותאריך עברי.
        </p>
        <Button asChild size="lg" className="text-lg">
          <Link href="/videos">צפייה בשיעורים</Link>
        </Button>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Video className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">שיעורי וידאו</h3>
          <p className="text-muted-foreground leading-relaxed">מאגר עשיר של שיעורי הלכה מוקלטים באיכות גבוהה</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">תמלול מלא</h3>
          <p className="text-muted-foreground leading-relaxed">כל שיעור מגיע עם תמלול מלא לנוחיותכם</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">חיפוש וסינון</h3>
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
