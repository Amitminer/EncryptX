import { DecryptForm } from "../../components/forms/decrypt-form"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "EncryptX | Decrypt",
}

export default function DecryptPage() {
  return (
    <div className="container mx-auto px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-white">Decrypt Files</h1>
        <p className="text-gray-400 text-lg">
          Securely decrypt your files with ease.
        </p>
      </div>

      <div className="mt-12 max-w-4xl mx-auto text-center">
        <DecryptForm />

        {/* Link */}
         
        <p className="text-gray-500 mb-8 max-w-lg">
          Need to encrypt a file instead?{" "}
          <a href="/encrypt" className="text-blue-400 hover:text-blue-300 underline font-medium">
            Go to Encrypt
          </a>
        </p>

        <p className="text-sm text-gray-500 italic max-w-md mx-auto px-2 leading-relaxed">
          Note: Files are processed temporarily and never stored. They are deleted immediately after encryption or decryption to ensure your privacy.
        </p>
      </div>
    </div>
  )
}
