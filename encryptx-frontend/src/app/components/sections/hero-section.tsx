import Link from "next/link"
import { Lock, Upload, Download, Zap, Shield } from "lucide-react"
import { Button } from "@/app/ui/button"
import { SiGithub } from "react-icons/si"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden py-4 sm:py-20">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: "2s" }} />
        <div className="absolute top-60 right-40 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: "3s" }} />

        <div className="absolute top-1/4 left-1/4 w-40 h-40 sm:w-96 sm:h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-80 sm:h-80 bg-cyan-600/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 sm:w-[600px] sm:h-[600px] bg-pink-600/10 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: "1s" }} />

        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
        {/* Icon */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-block p-5 sm:p-6 rounded-full border border-cyan-500/30 backdrop-blur-sm hero-lock-glow">
            <Lock className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-pulse" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 sm:mb-6 gradient-text">
          EncryptX
        </h1>

        {/* Subtitle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-10 sm:mb-8">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <p className="text-base sm:text-lg text-gray-300">Simple File Encryption Tool</p>
            <Shield className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-4 justify-center items-center mb-10 sm:mb-12 w-full sm:w-auto">
          <Link href="/encrypt" className="w-full sm:w-auto">
            <div className="relative group w-full sm:w-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <Button className="relative btn-encrypt-soft w-full px-8 py-5 sm:px-12 sm:py-6 text-lg sm:text-xl font-semibold text-white rounded-full border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                <Upload className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Encrypt File
              </Button>
            </div>
          </Link>

          <Link href="/decrypt" className="w-full sm:w-auto">
            <div className="relative group w-full sm:w-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300" />
              <Button className="relative btn-decrypt-soft w-full px-8 py-5 sm:px-12 sm:py-6 text-lg sm:text-xl font-semibold text-white rounded-full border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Decrypt File
              </Button>
            </div>
          </Link>
        </div>

        {/* Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>AES-256 Encryption</span>
          </div>
          <div className="flex items-center gap-1">
            <SiGithub className="w-3 h-3 text-gray-400" />
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </section>
  )
}