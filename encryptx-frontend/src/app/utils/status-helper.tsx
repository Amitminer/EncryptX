import { AlertCircle, CheckCircle } from "lucide-react"

export const EncryptStatusHelper = {
  getStatusIcon: (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'encrypting':
        return (
          <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        )
      default:
        if (status.includes('error') || status.includes('Error')) {
          return <AlertCircle className="w-4 h-4 text-red-400" />
        }
        return null
    }
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case 'done':
        return "text-green-400"
      case 'encrypting':
        return "text-pink-400"
      default:
        if (status.includes('error') || status.includes('Error')) {
          return "text-red-400"
        }
        return "text-blue-400"
    }
  }
}

export const DecryptStatusHelper = {
  getStatusIcon: (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'decrypting':
      case 'verifying':
        return (
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )
      default:
        if (status.includes('Error') || status.includes('Wrong') || status.includes('required')) {
          return <AlertCircle className="w-4 h-4 text-red-400" />
        }
        return null
    }
  },
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'done':
        return "text-green-400"
      case 'decrypting':
      case 'verifying':
        return "text-cyan-400"
      default:
        if (status.includes('Error') || status.includes('Wrong') || status.includes('required')) {
          return "text-red-400"
        }
        return "text-blue-400"
    }
  },
  getStatusText: (status: string): string => {
    switch (status) {
      case 'decrypting':
        return "Decrypting..."
      case 'verifying':
        return "Verifying password..."
      case 'done':
        return "Done"
      default:
        return status
    }
  }
}