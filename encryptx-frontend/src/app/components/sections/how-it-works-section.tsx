import Link from "next/link"
import { Upload, Shield, Download, CheckCircle } from "lucide-react"

/**
 * Renders a clean section explaining the file encryption and decryption process.
 */
export function HowItWorksSection() {
  const steps = [
    {
      icon: Upload,
      title: "Upload File",
      description: "Drag and drop or select any file in the secure browser panel.",
      detail: "All file types supported"
    },
    {
      icon: Shield,
      title: "Encrypt Securely",
      description: "Your file is encrypted locally using AES-256-GCM with your password or a key.",
      detail: "Zero key retention"
    },
    {
      icon: Download,
      title: "Download Output",
      description: "Download the encrypted file with a secure .xd extension instantly.",
      detail: "No files kept on server"
    },
    {
      icon: CheckCircle,
      title: "Decrypt Anytime",
      description: "Upload the encrypted file on the decrypt page and enter your key to restore it.",
      detail: "One-click restoration"
    }
  ]

  return (
    <section className="py-10 sm:py-16 px-4 border-t border-slate-900">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1.5 block">Process</span>
          <h2 className="text-2xl sm:text-3.5xl font-bold text-white mb-2">
            Data Flow & Process
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Understanding the step-by-step pipeline for encrypting and restoring files.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="card-clickable-subtle p-5 text-left flex flex-col justify-between min-h-[200px]">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <step.icon className="w-4 h-4 text-indigo-450" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">0{index + 1}</span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
                  {step.title}
                </h3>
                <p className="text-slate-450 text-xs leading-relaxed mb-4">
                  {index === 3 ? (
                    <>
                      Upload your `.xd` file in the{" "}
                      <Link href="/decrypt" className="text-indigo-450 hover:underline">
                        Decrypt panel
                      </Link>
                      , provide the password or key, and restore the file.
                    </>
                  ) : (
                    step.description
                  )}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
