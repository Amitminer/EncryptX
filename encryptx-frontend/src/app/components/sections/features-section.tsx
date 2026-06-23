import { Shield, Zap, Eye } from "lucide-react"

/**
 * Renders a clean section highlighting three core features of the EncryptX product.
 */
export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "AES-256 Encryption",
      description: "EncryptX uses secure, modern AES-256-GCM encryption implemented in Rust, with strong password protection and tamper detection.",
      stats: "256-bit"
    },
    {
      icon: Zap,
      title: "Fast Execution",
      description: "Optimized encryption and decryption with Rust and native I/O. Ideal for small-to-medium files with minimal wait time.",
      stats: "Instant"
    },
    {
      icon: Eye,
      title: "Zero Data Stored",
      description: "We don’t store your files or keys. Files are processed temporarily and securely—your data stays in your control.",
      stats: "0% Retained"
    },
  ]

  return (
    <section className="py-10 sm:py-16 px-4 border-t border-slate-900">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1.5 block">Implementation</span>
          <h2 className="text-2xl sm:text-3.5xl font-bold text-white mb-2">
            Design & Architecture
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            A simple demonstration of client-side logic paired with a memory-safe Rust backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card-clickable-subtle p-5 text-left flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <feature.icon className="w-5 h-5 text-indigo-450" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {feature.stats}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
