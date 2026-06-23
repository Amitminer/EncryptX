import Link from "next/link"
import { Lock, Upload, Download, Shield } from "lucide-react"
import { Button } from "@/app/ui/button"
import { SiGithub } from "react-icons/si"

/**
 * Renders a clean, subtle hero section for the EncryptX web application.
 */
export function HeroSection() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center px-4 overflow-hidden py-8 sm:py-16">
      {/* Subtle Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        {/* Centered Lock Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <Lock className="w-7 h-7 text-indigo-450" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Secure File Encryption
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Encrypt and decrypt files instantly in your browser. Powered by memory-safe Rust cryptography and AES-256-GCM.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 max-w-sm mx-auto">
          <Link href="/encrypt" className="w-full sm:w-auto flex-1">
            <Button variant="default" className="w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md bg-indigo-650 hover:bg-indigo-700 text-white border-0">
              <Upload className="w-4 h-4" />
              <span>Encrypt File</span>
            </Button>
          </Link>

          <Link href="/decrypt" className="w-full sm:w-auto flex-1">
            <Button variant="secondary" className="w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white border-0">
              <Download className="w-4 h-4" />
              <span>Decrypt File</span>
            </Button>
          </Link>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>AES-256-GCM</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <SiGithub className="w-3.5 h-3.5 text-slate-400" />
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </section>
  )
}