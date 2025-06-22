import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/app/layout/navigation"
import { BackendKeepAlive } from "@/app/utils/backend-keep-alive"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EncryptX - Simple File Encryption Tool",
  description: "Secure your files with powerful AES-256 encryption. Upload, encrypt, and download with ease.",
  keywords: "file encryption, AES-256, secure files, privacy, encryption tool",
}

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
        <main>{children}</main>
      </body>
    </html>
  )
}
