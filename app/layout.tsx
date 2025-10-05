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
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-primary">
                הלכה יומית
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-foreground hover:text-primary transition-colors">
                  בית
                </Link>
                <Link href="/videos" className="text-foreground hover:text-primary transition-colors">
                  שיעורים
                </Link>
              </div>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t mt-16 py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} הלכה יומית - הרב בוטבול</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
