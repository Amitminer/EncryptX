// Decryption Types

interface DecryptFileStatus {
  [fileName: string]: 'verifying' | 'decrypting' | 'done' | 'error' | string
}

interface DecryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  hasPassword: boolean
  onClick: () => void
}

interface DecryptionError {
  status: number
  message: string
}

// Encryption Types
interface EncryptFileStatus {
  [fileName: string]: 'encrypting' | 'done' | 'error' | string
}

interface EncryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  onClick: () => void
}

// Global Types

interface PasswordInputProps {
  password: string
  onChange: (password: string) => void
}

interface FileListItemProps {
  file: File
  index: number
  status?: string
  onRemove: (fileName: string) => void
  isProcessing: boolean
}
