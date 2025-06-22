// Decryption Types
export interface DecryptFileStatus {
  [fileName: string]: 'verifying' | 'decrypting' | 'done' | 'error' | string
}

export interface DecryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  hasPassword: boolean
  onClick: () => void
}

export interface DecryptionError {
  status: number
  message: string
}

// Encryption Types
export interface EncryptFileStatus {
  [fileName: string]: 'encrypting' | 'done' | 'error' | string
}

export interface EncryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  onClick: () => void
}

// Global Types

export interface PasswordInputProps {
  password: string
  onChange: (password: string) => void
}

export interface FileListItemProps {
  file: File
  index: number
  status?: string
  onRemove: (fileName: string) => void
  isProcessing: boolean
}
