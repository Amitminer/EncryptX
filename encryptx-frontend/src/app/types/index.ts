/** TypeScript interfaces for EncryptX frontend components */

// Decryption Types
/** File decryption status tracking */
export interface DecryptFileStatus {
  [fileName: string]: 'verifying' | 'decrypting' | 'done' | 'error' | string
}

/** Props for decrypt button component */
export interface DecryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  hasPassword: boolean
  onClick: () => void
}

/** Decryption error response structure */
export interface DecryptionError {
  status: number
  message: string
}

// Encryption Types
/** File encryption status tracking */
export interface EncryptFileStatus {
  [fileName: string]: 'encrypting' | 'done' | 'error' | string
}

/** Props for encrypt button component */
export interface EncryptButtonProps {
  isDisabled: boolean
  isProcessing: boolean
  fileCount: number
  onClick: () => void
}

// Global Types
/** Props for password input component */
export interface PasswordInputProps {
  password: string
  onChange: (password: string) => void
}

/** Props for file list item component */
export interface FileListItemProps {
  file: File
  index: number
  status?: string
  onRemove: (fileName: string) => void
  isProcessing: boolean
}
