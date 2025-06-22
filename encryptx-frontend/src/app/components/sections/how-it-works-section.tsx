import Link from "next/link"
import { Upload, Shield, Download, ArrowRight, CheckCircle } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      icon: Upload,
      title: "Upload File",
      description: "Drag and drop or select your file in the browser",
      detail: "All file types supported",
      color: "cyan"
    },
    {
      icon: Shield,
      title: "Encrypt Securely",
      description: "File is encrypted using AES-256-GCM with password protection and tamper detection",
      detail: "Processed securely via backend",
      color: "purple"
    },
    {
      icon: Download,
      title: "Download Result",
      description: "Your file is returned with the .xd extension, encrypted and ready to store or share",
      detail: "Instant download",
      color: "pink"
    },
    {
      icon: CheckCircle,
      title: "Decrypt Anytime",
      description: "Visit the Decrypt page, upload your .xd file, enter your password, and get your original back",
      detail: "One-click restore",
      color: "green"
    }
  ]

  return (
    <section className="py-8 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-600/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-600/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-full max-w-4xl h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"></div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-purple-500"></div>
            <span className="text-purple-400 text-sm font-medium tracking-wider uppercase">Process</span>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-purple-500"></div>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            Four simple steps to secure your files with trusted encryption
          </p>
        </div>

        <div className="how-it-works-card p-6 sm:p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 opacity-50"></div>

          <div className="relative z-10">
            {/* Desktop layout */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-4 gap-8 mb-12">
                {steps.map((step, index) => (
                  <div key={index} className="relative group">
                    {index < steps.length - 1 && (
                      <div className="absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-600 to-gray-800 group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-500 z-10">
                        <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors duration-500" />
                      </div>
                    )}

                    <div className="flex justify-center mb-6">
                      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${
                        step.color === 'cyan' ? 'from-cyan-500 to-cyan-700' :
                        step.color === 'purple' ? 'from-purple-500 to-purple-700' :
                        step.color === 'pink' ? 'from-pink-500 to-pink-700' :
                        'from-green-500 to-green-700'
                      } flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                        <step.icon className="w-8 h-8 text-white" />
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${
                          step.color === 'cyan' ? 'from-cyan-400/50 to-transparent' :
                          step.color === 'purple' ? 'from-purple-400/50 to-transparent' :
                          step.color === 'pink' ? 'from-pink-400/50 to-transparent' :
                          'from-green-400/50 to-transparent'
                        } blur animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed mb-2">{step.description}</p>
                      <div className={`inline-flex items-center space-x-1 text-sm ${
                        step.color === 'cyan' ? 'text-cyan-400' :
                        step.color === 'purple' ? 'text-purple-400' :
                        step.color === 'pink' ? 'text-pink-400' :
                        'text-green-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          step.color === 'cyan' ? 'bg-cyan-400' :
                          step.color === 'purple' ? 'bg-purple-400' :
                          step.color === 'pink' ? 'bg-pink-400' :
                          'bg-green-400'
                        } animate-pulse`}></div>
                        <span>{step.detail}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile layout */}
            <div className="lg:hidden space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${
                      step.color === 'cyan' ? 'from-cyan-500 to-cyan-700' :
                      step.color === 'purple' ? 'from-purple-500 to-purple-700' :
                      step.color === 'pink' ? 'from-pink-500 to-pink-700' :
                      'from-green-500 to-green-700'
                    } flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-16 bg-gradient-to-b from-gray-600 to-gray-800 mx-auto mt-4"></div>
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-3">
                      {index === 3 ? (
                        <>
                          Visit the{" "}
                          <Link href="/decrypt" className="text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors duration-300">
                            Decrypt
                          </Link>{" "}
                          page, upload your .xd file, enter your password, and get your original back.
                        </>
                      ) : (
                        step.description
                      )}
                    </p>
                    <div className={`inline-flex items-center space-x-2 text-sm ${
                      step.color === 'cyan' ? 'text-cyan-400' :
                      step.color === 'purple' ? 'text-purple-400' :
                      step.color === 'pink' ? 'text-pink-400' :
                      'text-green-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        step.color === 'cyan' ? 'bg-cyan-400' :
                        step.color === 'purple' ? 'bg-purple-400' :
                        step.color === 'pink' ? 'bg-pink-400' :
                        'bg-green-400'
                      } animate-pulse`}></div>
                      <span className="font-medium">{step.detail}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
