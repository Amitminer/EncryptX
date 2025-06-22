import { Shield, Zap, Eye } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      iconClass: "icon-purple-soft",
      title: "AES-256 Encryption",
      description: "EncryptX uses secure, modern AES-256-GCM encryption implemented in Rust, with strong password protection and tamper detection.",
      accent: "purple",
      stats: "256-bit"
    },
    {
      icon: Zap,
      iconClass: "icon-cyan-soft",
      title: "Fast Encryption",
      description: "Optimized encryption and decryption with Rust and native I/O. Ideal for small-to-medium files with minimal wait time.",
      accent: "cyan",
      stats: "Quick"
    },
    {
      icon: Eye,
      iconClass: "icon-pink-soft",
      title: "Zero Data Stored",
      description: "We don’t store your files or keys. Files are processed temporarily and securely—your data stays in your control.",
      accent: "pink",
      stats: "0% Stored"
    },
  ]

  return (
    <section className="py-8 sm:py-16 px-4 sm:px-6 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-600/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-16">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-500"></div>
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">Features</span>
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-cyan-500"></div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Honest Security, Built Right
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transparent, privacy-first file encryption powered by trusted cryptography
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                feature.accent === 'purple' ? 'from-purple-600 to-purple-400' :
                feature.accent === 'cyan' ? 'from-cyan-600 to-cyan-400' :
                'from-pink-600 to-pink-400'
              } rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300`}></div>

              <div className="relative card-cyberpunk p-6 sm:p-8 text-center h-full border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    feature.accent === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    feature.accent === 'cyan' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  }`}>
                    {feature.stats}
                  </div>
                </div>

                <div className="mb-6 flex justify-center relative">
                  <div className={`absolute inset-0 rounded-full ${
                    feature.accent === 'purple' ? 'bg-purple-500/20' :
                    feature.accent === 'cyan' ? 'bg-cyan-500/20' :
                    'bg-pink-500/20'
                  } blur-xl animate-pulse`}></div>
                  <div className={`relative p-4 sm:p-5 rounded-full ${feature.iconClass} border ${
                    feature.accent === 'purple' ? 'border-purple-500/30' :
                    feature.accent === 'cyan' ? 'border-cyan-500/30' :
                    'border-pink-500/30'
                  } backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                  {feature.title}
                </h3>

                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  {feature.description}
                </p>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
