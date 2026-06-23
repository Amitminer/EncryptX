import { DecryptForm } from "../../components/forms/decrypt-form"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "EncryptX | Decrypt",
}

/**
 * Renders the Decrypt page, providing a user interface for securely decrypting files.
 *
 * Displays a heading, a brief description, the decryption form, a link to the encryption page, and a privacy note about file handling.
 */
export default function DecryptPage() {
  return (
      <div className="max-w-4xl mx-auto text-center pt-8">
        <DecryptForm />

        {/* Link */}
         
        <p className="text-gray-500 mb-6 max-w-lg mx-auto text-xs sm:text-sm">
          Need to encrypt a file instead?{" "}
          <a href="/encrypt" className="text-blue-400 hover:text-blue-300 underline font-medium">
            Go to Encrypt
          </a>
        </p>

        <p className="text-[11px] sm:text-xs text-gray-500 italic max-w-md mx-auto px-2 leading-relaxed">
          Note: Files are processed temporarily and never stored. They are deleted immediately after encryption or decryption to ensure your privacy.
        </p>
      </div>
  )
}
