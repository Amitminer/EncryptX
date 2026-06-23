import { getCurrentYear, getVersion, GitHubUrl } from "@/app/utils"
import { Heart } from "lucide-react"
import { SiGithub } from "react-icons/si"

/**
 * Renders the application footer with GitHub link and version info.
 */
export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-slate-800">
      <div className="container mx-auto">
        <div className="text-center text-sm text-slate-400 space-y-4">
          {/* GitHub Link */}
          <div className="flex justify-center items-center">
            <a
              href={GitHubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 hover:text-white transition-colors duration-200"
            >
              <SiGithub className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Made with ❤️ + Rust */}
          <div className="flex justify-center items-center flex-wrap gap-1.5 text-slate-500">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>and</span>
            <span className="text-slate-400 font-medium">Rust</span>
          </div>

          {/* Final line */}
          <div className="pt-2 text-slate-600 text-xs sm:text-sm">
            © {getCurrentYear()} EncryptX · v{getVersion()}
          </div>
        </div>
      </div>
    </footer>
  )
}
