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
    <div className="container mx-auto px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">Encrypt Files</h1>
        <p className="text-gray-400 text-lg">
          Securely encrypt your files with ease.
        </p>
      </div>

      <div className="mt-12 max-w-4xl mx-auto text-center">
        <EncryptForm />
        
        <p className="text-gray-500 mb-8 max-w-lg">
          Need to decrypt a file instead?{" "}
          <a href="/decrypt" className="text-blue-400 hover:text-blue-300 underline font-medium">
            Go to Decrypt
          </a>
        </p>

        <p className="text-sm text-gray-500 italic max-w-md mx-auto px-2 leading-relaxed">
          Note: Files are processed temporarily and not stored. They are deleted after processing to ensure your privacy and security.
        </p>
      </div>
    </div>
  )
}
