import type React from "react"
import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
})

export const metadata: Metadata = {
  title: "הלכה יומית - הרב בוטבול",
  description: "שיעורי הלכה יומיים של הרב בוטבול",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="antialiased">
        <header className="border-b bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-l from-primary to-primary/80 bg-clip-text text-transparent hover:from-primary/90 hover:to-primary/70 transition-all">
                הלכה יומית
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  בית
                </Link>
                <Link href="/videos" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                  שיעורים
                </Link>
              </div>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t mt-16 py-8 bg-gradient-to-br from-muted/50 via-accent/5 to-muted/50">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} הלכה יומית - הרב בוטבול</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
