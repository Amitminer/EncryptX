import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/app/layout/navigation"
import { BackendKeepAlive } from "@/app/utils/backend-keep-alive"
import { Toaster } from "@/app/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EncryptX - Simple File Encryption Tool",
  description: "Secure your files with powerful AES-256 encryption. Upload, encrypt, and download with ease.",
  keywords: "file encryption, AES-256, secure files, privacy, encryption tool",
}

/** Root layout with navigation, fonts, and global components */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen text-white`}>
        <BackendKeepAlive />
        <Navigation />
        <main className="pt-16 sm:pt-18">{children}</main>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  )
}
