import Link from "next/link"
import { Button } from "@/app/ui/button"
import { ArrowRight, Zap, Shield, Star, Lock } from "lucide-react"
import { SiGithub } from "react-icons/si"

export function CTASection() {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-gradient-to-r from-purple-600/15 to-cyan-600/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-72 md:w-80 h-56 sm:h-72 md:h-80 bg-gradient-to-r from-pink-600/15 to-purple-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>

        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="cta-card p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-cyan-500 to-purple-500 opacity-60"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative p-3 sm:p-4 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                  <Lock className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-white" />
                </div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 relative">
                Ready to Try EncryptX?
                <div className="absolute inset-0 text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-cyan-400/20 blur-sm">
                  Ready to Try EncryptX?
                </div>
              </h2>

              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base font-medium">Fast & Lightweight</span>
                </div>
                <div className="w-1 h-3 sm:h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2 text-purple-400">
                  <Shield className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base font-medium">AES-256 Secured</span>
                </div>
                <div className="w-1 h-3 sm:h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2 text-pink-400">
                  <Star className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span className="text-xs sm:text-sm md:text-base font-medium">Privacy Focused</span>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
              Encrypt your files using robust AES-256 encryption—built with secure defaults, no registration needed.
              <span className="text-cyan-400 font-semibold"> Your data. Your control.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 lg:gap-8 justify-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-4xl mx-auto">
              <Link href="/encrypt" className="flex-1 sm:flex-none">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                  <Button className="relative btn-encrypt-soft px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-6 lg:py-8 text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white rounded-full transition-all duration-300 border-2 border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] lg:min-w-[250px] hover:shadow-2xl hover:shadow-cyan-500/25">
                    <Zap className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 mr-2 sm:mr-3 md:mr-4 group-hover:animate-spin" />
                    Get Started Now
                    <ArrowRight className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 ml-2 sm:ml-3 md:ml-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </Link>

              <a
                href="https://github.com/Amitminer/EncryptX"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group flex-1 sm:flex-none"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <Button
                  variant="outline"
                  className="relative px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-6 lg:py-8 text-base sm:text-lg md:text-xl lg:text-2xl font-semibold border-2 border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-400/50 rounded-full transition-all duration-300 bg-black/20 backdrop-blur-sm w-full sm:w-auto sm:min-w-[200px] md:min-w-[220px] lg:min-w-[250px] hover:shadow-xl"
                >
                  <SiGithub className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 mr-2 sm:mr-3 md:mr-4 group-hover:rotate-12 transition-transform duration-300" />
                  View on GitHub
                </Button>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 lg:space-x-8 text-gray-400 text-xs sm:text-sm md:text-base">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Client-Server Hybrid</span>
              </div>
              <div className="w-1 h-3 sm:h-4 bg-gray-600 hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>AES-256 Encryption</span>
              </div>
              <div className="w-1 h-3 sm:h-4 bg-gray-600 hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Open Source</span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-cyan-400 mb-1">Fast</div>
                  <div className="text-xs sm:text-sm text-gray-400">Encryption Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-400 mb-1">AES-256</div>
                  <div className="text-xs sm:text-sm text-gray-400">Encryption Standard</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-pink-400 mb-1">Ephemeral</div>
                  <div className="text-xs sm:text-sm text-gray-400">No Data Stored</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}