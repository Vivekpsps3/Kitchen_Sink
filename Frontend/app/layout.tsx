import type React from "react"
import "./globals.css"
import { gaya, matina } from "./fonts"
import Footer from "@/components/footer"

export const metadata = {
  title: "KitchenSink! - Discover Culinary Excellence",
  description: "The ultimate culinary companion for discovering, creating, and sharing exceptional recipes.",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${gaya.variable} ${matina.variable}`}>
      <body>
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  )
}


import './globals.css'