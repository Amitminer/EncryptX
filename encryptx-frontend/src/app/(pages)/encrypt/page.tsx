import { EncryptForm } from "../../components/forms/encrypt-form"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "EncryptX | Encrypt",
}

/**
 * Renders the encryption page UI, providing a form for users to encrypt files and information about file privacy.
 *
 * Displays a header, an encryption form, a link to the decryption page, and a privacy notice regarding file handling.
 */
export default function EncryptPage() {
  return (
      <div className="max-w-4xl mx-auto text-center pt-8">
        <EncryptForm />
        
        <p className="text-gray-500 mb-6 max-w-lg mx-auto text-xs sm:text-sm">
          Need to decrypt a file instead?{" "}
          <a href="/decrypt" className="text-blue-400 hover:text-blue-300 underline font-medium">
            Go to Decrypt
          </a>
        </p>

        <p className="text-[11px] sm:text-xs text-gray-500 italic max-w-md mx-auto px-2 leading-relaxed">
          Note: Files are processed temporarily and not stored. They are deleted after processing to ensure your privacy and security.
        </p>
      </div>
  )
}
