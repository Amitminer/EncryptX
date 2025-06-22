"use client"

import { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
  Lock, Upload, Eye, KeyRound, Shield, Zap, File, Cpu
} from "lucide-react"
import { formatFileSize } from "@/app/utils"
import { EncryptStatusHelper } from "@/app/utils/status-helper"
import {EncryptFileStatus, EncryptButtonProps, PasswordInputProps, FileListItemProps} from "@/app/types"

// Constants
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
const ENCRYPTION_ENDPOINT = "/encrypt"
const ENCRYPTED_FILE_EXTENSION = ".xd"
const KEY_SIZE_BYTES = 32

const generateSecureKey = (): string => {
  const array = new Uint8Array(KEY_SIZE_BYTES)
  window.crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

const getFileNameWithoutExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".")
  return lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex)
}

// Subcomponents
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-10 right-10 w-2 h-2 bg-pink-400 rounded-full animate-pulse opacity-60" />
    <div className="absolute top-32 left-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40" />
    <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-50" />
    <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-pink-300 rounded-full animate-ping opacity-30" />
  </div>
)

const HeroIcon = () => (
  <div className="flex justify-center mb-10 sm:mb-12 relative">
    <div className="relative">
      <div
        className="absolute inset-0 w-24 h-24 border-2 border-pink-400/20 rounded-full animate-spin"
        style={{ animationDirection: 'reverse' }}
      />
      <div className="absolute inset-2 w-20 h-20 border border-cyan-400/30 rounded-full animate-pulse" />
      <div className="p-6 rounded-full hero-lock-glow relative z-10 bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-sm">
        <Lock className="w-12 h-12 text-white drop-shadow-lg" />
      </div>
      <Shield className="absolute -top-2 -left-2 w-6 h-6 text-pink-400 animate-bounce opacity-70" />
      <Cpu className="absolute -bottom-1 -right-1 w-5 h-5 text-cyan-400 animate-pulse opacity-60" />
    </div>
  </div>
)

const TitleSection = () => (
  <div className="text-center mb-12">
    <div className="relative inline-block">
      <p className="text-white text-2xl mb-3 font-bold tracking-wider relative z-10">
        ENCRYPT FILES
        <span className="absolute inset-0 text-pink-400 opacity-20 translate-x-0.5 translate-y-0.5 pointer-events-none">
          ENCRYPT FILES
        </span>
      </p>
    </div>
    <div className="flex items-center justify-center gap-2">
      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-400" />
      <p className="text-cyan-400 font-medium text-lg px-4 bg-zinc-900/40 rounded-full py-1 border border-cyan-400/20">
        Supports all file types
      </p>
      <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-cyan-400" />
    </div>
  </div>
)

const FileListItem = ({ file, index, status, onRemove, isProcessing }: FileListItemProps) => (
  <div
    className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-zinc-800/80 to-zinc-900/60 rounded-xl px-4 py-3 border border-pink-400/20 hover:border-cyan-400/40 transition-all duration-300 group/file hover:bg-pink-900/20"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <File className="w-4 h-4 text-pink-400 flex-shrink-0" />
    <span className="truncate max-w-[150px] sm:max-w-xs md:max-w-sm text-pink-100 font-mono">
      {file.name}
    </span>
    <span className="text-xs text-gray-400 bg-zinc-800/60 px-2 py-1 rounded-full">
      {formatFileSize(file.size)} MB
    </span>

    {status && (
      <div className="flex items-center gap-2 ml-2">
        {EncryptStatusHelper.getStatusIcon(status)}
        <span className={`text-xs font-medium ${EncryptStatusHelper.getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    )}

    <button
      type="button"
      aria-label={`Remove ${file.name}`}
      className="ml-auto w-10 h-10 flex items-center justify-center text-pink-400 hover:text-pink-300 hover:bg-pink-400/10 rounded-full transition-all duration-200 group-hover/file:opacity-100 opacity-80 text-2xl"
      onClick={(e) => {
        e.stopPropagation()
        onRemove(file.name)
      }}
      disabled={status === 'encrypting'}
      style={{ textShadow: '0 0 6px #ff3cac, 0 0 2px #fff' }}
    >
      ×
    </button>
  </div>
)

const PasswordInput = ({ password, onChange }: PasswordInputProps) => (
  <div className="mb-8">
    <div className="relative group">
      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-pink-400 pointer-events-none z-10 group-focus-within:text-cyan-400 transition-colors duration-300" />
      <input
        type="password"
        placeholder="Encryption Password (optional but recommended)"
        value={password}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gradient-to-r from-zinc-900/60 to-zinc-800/40 border border-pink-400/30 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-base focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 text-lg backdrop-blur-sm hover:border-pink-400/50 group relative z-0"
      />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-8 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
        <div className="absolute bottom-0 right-1/4 w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      </div>
    </div>
    <div className="mt-3 pl-4 flex items-start gap-2">
      <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2 flex-shrink-0 animate-pulse" />
      <p className="text-sm text-gray-500 leading-relaxed">
        Leave empty to auto-generate a secure key (embedded in the file).
      </p>
    </div>
  </div>
)

const EncryptButton = ({ isDisabled, isProcessing, fileCount, onClick }: EncryptButtonProps) => (
  <div className="relative">
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full py-6 text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-0 shadow-lg relative overflow-hidden group hover:shadow-pink-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

      {isProcessing ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
          <span className="animate-pulse">Encrypting...</span>
          <div className="ml-3 flex space-x-1">
            {[0, 150, 300].map((delay, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Lock className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-200" />
          {fileCount >= 1 ? "Encrypt & Download All" : "Encrypt & Download"}
          <Zap className="w-5 h-5 ml-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      )}
    </Button>

    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>
)

/**
 * Renders a form interface for encrypting files with optional password protection.
 *
 * Users can select or drag-and-drop multiple files, optionally enter a password, and initiate encryption. Each file is sent to a backend service for encryption and is automatically downloaded upon completion. The UI displays encryption status for each file and provides animated visual feedback throughout the process.
 */
export function EncryptForm() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<EncryptFileStatus>({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Memoized values
  const hasFiles = useMemo(() => files.length > 0, [files.length])
  const isButtonDisabled = useMemo(() => !hasFiles || isProcessing, [hasFiles, isProcessing])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setStatus({})
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const handleRemoveFile = useCallback((fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[fileName]
      return newStatus
    })
  }, [])

  const downloadFile = useCallback((blob: Blob, originalFileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `${getFileNameWithoutExtension(originalFileName)}${ENCRYPTED_FILE_EXTENSION}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [])

  const encryptSingleFile = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const url = `${BACKEND_URL}${ENCRYPTION_ENDPOINT}`

      xhr.open("POST", url)
      xhr.setRequestHeader("Content-Type", "application/octet-stream")
      xhr.setRequestHeader("x-orig-filename", file.name)

      if (password) {
        xhr.setRequestHeader("x-password", password)
      } else {
        xhr.setRequestHeader("x-enc-key", generateSecureKey())
      }

      xhr.responseType = "blob"

      xhr.onload = () => {
        if (xhr.status === 200) {
          downloadFile(xhr.response, file.name)
          resolve()
        } else {
          reject(new Error(`HTTP ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error("Network error"))

      file.arrayBuffer()
        .then(buffer => xhr.send(buffer))
        .catch(reject)
    })
  }, [password, downloadFile])

  const handleEncrypt = useCallback(async () => {
    if (!hasFiles) return

    setIsProcessing(true)
    const newStatus: EncryptFileStatus = {}

    for (const file of files) {
      try {
        newStatus[file.name] = 'encrypting'
        setStatus({ ...newStatus })

        await encryptSingleFile(file)

        newStatus[file.name] = 'done'
        setStatus({ ...newStatus })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        newStatus[file.name] = `Error: ${errorMessage}`
        setStatus({ ...newStatus })
      }
    }

    setIsProcessing(false)
  }, [hasFiles, files, encryptSingleFile])

  return (
    <div className="relative">
      <AnimatedBackground />

      <div className="card-cyberpunk p-6 sm:p-10 md:p-12 max-w-2xl lg:max-w-4xl mx-auto relative z-10">
        <HeroIcon />
        <TitleSection />

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`relative upload-area-cyberpunk p-4 sm:p-8 md:p-10 text-center cursor-pointer transition-all duration-500 mb-10 sm:mb-12 rounded-2xl border border-pink-700/40 bg-zinc-900/70 shadow-inner group ${isDragActive ? "scale-105 ring-2 ring-pink-500 border-pink-400 shadow-pink-400/25" : ""
            }`}
          style={{ minHeight: 180 }}
        >
          <input {...getInputProps()} />

          {/* Corner accents */}
          {[
            { position: "top-2 left-2", borders: "border-l-2 border-t-2", color: "border-pink-400" },
            { position: "top-2 right-2", borders: "border-r-2 border-t-2", color: "border-cyan-400" },
            { position: "bottom-2 left-2", borders: "border-l-2 border-b-2", color: "border-cyan-400" },
            { position: "bottom-2 right-2", borders: "border-r-2 border-b-2", color: "border-pink-400" }
          ].map((accent, i) => (
            <div
              key={i}
              className={`absolute ${accent.position} w-6 h-6 ${accent.borders} ${accent.color} opacity-60 group-hover:opacity-100 transition-opacity`}
            />
          ))}

          <div className="mb-8 relative">
            <div className="relative inline-block">
              <Upload className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-pink-400 mx-auto mb-4 sm:mb-6 transition-all duration-300 ${isDragActive ? "text-cyan-400 scale-110" : "group-hover:text-purple-400"
                }`} />
              {isDragActive && (
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto border-2 border-pink-400 rounded-full animate-ping opacity-60" />
              )}
            </div>

            {hasFiles ? (
              <div className="space-y-4">
                <p className="text-white text-base sm:text-lg md:text-xl font-medium mb-4 sm:mb-6">
                  <File className="inline w-5 h-5 mr-2 text-pink-400" />
                  Selected Files:
                </p>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {files.map((file, index) => (
                    <FileListItem
                      key={file.name}
                      file={file}
                      index={index}
                      status={status[file.name]}
                      onRemove={handleRemoveFile}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white text-base sm:text-lg md:text-xl mb-2 sm:mb-3 font-medium">
                  {isDragActive ? (
                    <span className="text-pink-400 animate-pulse">Drop your files here</span>
                  ) : (
                    "Drag & drop your files here"
                  )}
                </p>
                <p className="text-gray-400 text-sm sm:text-lg">or</p>
              </div>
            )}
          </div>

          {!hasFiles && (
            <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-base sm:text-lg font-medium shadow-lg hover:shadow-pink-500/25 transition-all duration-300 border border-pink-400/20">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Browse Files
            </Button>
          )}
        </div>

        <PasswordInput password={password} onChange={setPassword} />

        <EncryptButton
          isDisabled={isButtonDisabled}
          isProcessing={isProcessing}
          fileCount={files.length}
          onClick={handleEncrypt}
        />
      </div>
    </div>
  )
}