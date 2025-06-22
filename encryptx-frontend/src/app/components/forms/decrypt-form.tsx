"use client"

import { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
  Unlock, Upload, Eye, KeyRound, Shield, Zap, File,
  CheckCircle, AlertCircle
} from "lucide-react"
import { formatFileSize } from "@/app/utils"
import { DecryptStatusHelper } from "@/app/utils/status-helper"

// Constants
const DECRYPTION_ENDPOINT = "/decrypt"
const ACCEPTED_FILE_TYPES = { "application/octet-stream": [".xd"] }
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

const extractFilenameFromHeader = (disposition: string): string => {
  console.log("Content-Disposition header:", disposition)

  // Try robust regex first
  let match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";\r\n]*)/i)
  if (match) {
    const filename = decodeURIComponent(match[1].trim())
    console.log("Extracted filename (robust regex):", filename)
    return filename
  }

  // Fallback: quoted value
  match = disposition.match(/filename="([^"]+)"/i)
  if (match) {
    const filename = match[1]
    console.log("Extracted filename (fallback regex):", filename)
    return filename
  }

  console.log("Filename not found in Content-Disposition header, using default.")
  return "decrypted.bin"
}

const getErrorMessage = (status: number, errorText?: string): string => {
  switch (status) {
    case 401:
      return "Wrong password or file is corrupt"
    case 400:
      return errorText || "Bad request"
    default:
      return `Error (${status})`
  }
}

// Subcomponents
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" />
    <div className="absolute top-32 right-20 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-40" />
    <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-50" />
    <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-ping opacity-30" />
  </div>
)

const HeroIcon = () => (
  <div className="flex justify-center mb-8 relative">
    <div className="relative">
      <div className="absolute inset-0 w-24 h-24 border-2 border-cyan-400/20 rounded-full animate-spin" />
      <div className="absolute inset-2 w-20 h-20 border border-pink-400/30 rounded-full animate-pulse" />
      <div className="p-6 rounded-full hero-lock-glow relative z-10 bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm">
        <Unlock className="w-12 h-12 text-white drop-shadow-lg" />
      </div>
      <Shield className="absolute -top-2 -right-2 w-6 h-6 text-cyan-400 animate-bounce opacity-70" />
      <Zap className="absolute -bottom-1 -left-1 w-5 h-5 text-pink-400 animate-pulse opacity-60" />
    </div>
  </div>
)

const TitleSection = () => (
  <div className="text-center mb-12">
    <div className="relative inline-block">
      <p className="text-white text-2xl mb-3 font-bold tracking-wider relative z-10">
        DECRYPT FILES
        <span className="absolute inset-0 text-cyan-400 opacity-20 translate-x-0.5 translate-y-0.5 pointer-events-none">
          DECRYPT FILES
        </span>
      </p>
    </div>
    <div className="flex items-center justify-center gap-2">
      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-pink-400" />
      <p className="text-pink-400 font-medium text-lg px-4 bg-zinc-900/40 rounded-full py-1 border border-pink-400/20">
        Only .xd files supported
      </p>
      <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-pink-400" />
    </div>
  </div>
)

// TODO: Add progress bar
const FileListItem = ({ file, index, status, onRemove, isProcessing }: FileListItemProps) => (
  <div
    className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-zinc-900/80 to-zinc-800/60 rounded-xl px-4 py-3 border border-purple-400/20 hover:border-pink-400/40 transition-all duration-300 group/file"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <File className="w-4 h-4 text-purple-400 flex-shrink-0" />
    <span className="truncate max-w-[150px] sm:max-w-xs text-white font-medium">
      {file.name}
    </span>
    <span className="text-xs text-gray-400 bg-zinc-800/60 px-2 py-1 rounded-full">
      {formatFileSize(file.size)} MB
    </span>

    {status && (
      <div className="flex items-center gap-2 ml-2">
        {DecryptStatusHelper.getStatusIcon(status)}
        <span className={`text-xs font-medium ${DecryptStatusHelper.getStatusColor(status)}`}>
          {DecryptStatusHelper.getStatusText(status)}
        </span>
      </div>
    )}

    <button
      type="button"
      aria-label={`Remove ${file.name}`}
      className="ml-auto w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-all duration-200 group-hover/file:opacity-100 opacity-80 text-2xl"
      onClick={(e) => {
        e.stopPropagation()
        onRemove(file.name)
      }}
      disabled={status === 'decrypting' || status === 'verifying'}
    >
      ×
    </button>
  </div>
)

const PasswordInput = ({ password, onChange }: PasswordInputProps) => (
  <div className="mb-8">
    <div className="relative group">
      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400 pointer-events-none z-10 group-focus-within:text-pink-400 transition-colors duration-300" />
      <input
        type="password"
        placeholder="Decryption Password (optional)"
        value={password}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gradient-to-r from-zinc-900/60 to-zinc-800/40 border border-purple-400/30 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 text-base sm:text-lg backdrop-blur-sm hover:border-purple-400/50 group relative z-0"
      />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute bottom-0 right-1/4 w-12 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
      </div>
    </div>
  </div>
)

const DecryptButton = ({ isDisabled, isProcessing, fileCount, hasPassword, onClick }: DecryptButtonProps) => (
  <div className="relative">
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full py-6 text-xl font-semibold btn-encrypt-soft text-white rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-0 relative overflow-hidden group shadow-2xl hover:shadow-pink-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

      {isProcessing ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
          <span className="animate-pulse">
            {hasPassword ? "Verifying..." : "Decrypting..."}
          </span>
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
          <Unlock className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-200" />
          {fileCount >= 1 ? "Decrypt & Download All" : "Decrypt & Download"}
          <Zap className="w-5 h-5 ml-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      )}
    </Button>

    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>
)

// Main component
export function DecryptForm() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<DecryptFileStatus>({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Memoized values
  const hasFiles = useMemo(() => files.length > 0, [files.length])
  const hasPassword = useMemo(() => password.length > 0, [password.length])
  const isButtonDisabled = useMemo(() => !hasFiles || isProcessing, [hasFiles, isProcessing])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setStatus({})
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: ACCEPTED_FILE_TYPES,
  })

  const handleRemoveFile = useCallback((fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[fileName]
      return newStatus
    })
  }, [])

  const downloadFile = useCallback((blob: Blob, xhr: XMLHttpRequest) => {
    let filename = "decrypted.bin"
    const disposition = xhr.getResponseHeader("Content-Disposition")

    if (disposition) {
      filename = extractFilenameFromHeader(disposition)
    }

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [])

  const handleDecryptError = useCallback(async (xhr: XMLHttpRequest): Promise<string> => {
    try {
      const reader = new FileReader()
      const errorText = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read error response"))
        reader.readAsText(xhr.response)
      })
      return getErrorMessage(xhr.status, errorText)
    } catch {
      return getErrorMessage(xhr.status)
    }
  }, [])

  const decryptSingleFile = useCallback(async (file: File): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const url = `${BACKEND_URL}${DECRYPTION_ENDPOINT}`

      xhr.open("POST", url)
      xhr.setRequestHeader("Content-Type", "application/octet-stream")

      if (hasPassword) {
        xhr.setRequestHeader("x-password", password)
      }

      xhr.responseType = "blob"

      xhr.onload = async () => {
        if (xhr.status === 200) {
          downloadFile(xhr.response, xhr)
          resolve()
        } else {
          try {
            const errorMessage = await handleDecryptError(xhr)
            reject(new Error(errorMessage))
          } catch (error) {
            reject(new Error(getErrorMessage(xhr.status)))
          }
        }
      }

      xhr.onerror = () => reject(new Error("Network error"))

      try {
        const buffer = await file.arrayBuffer()
        xhr.send(buffer)
      } catch (error) {
        reject(new Error("Failed to read file"))
      }
    })
  }, [password, hasPassword, downloadFile, handleDecryptError])

  const handleDecrypt = useCallback(async () => {
    if (!hasFiles) return

    setIsProcessing(true)
    const newStatus: DecryptFileStatus = {}

    for (const file of files) {
      try {
        const statusKey = hasPassword ? 'verifying' : 'decrypting'
        newStatus[file.name] = statusKey
        setStatus({ ...newStatus })

        await decryptSingleFile(file)

        newStatus[file.name] = 'done'
        setStatus({ ...newStatus })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        newStatus[file.name] = errorMessage
        setStatus({ ...newStatus })
      }
    }

    setIsProcessing(false)
  }, [hasFiles, hasPassword, files, decryptSingleFile])

  return (
    <div className="relative">
      <AnimatedBackground />

      <div className="card-cyberpunk p-6 sm:p-10 md:p-12 max-w-2xl lg:max-w-4xl mx-auto relative z-10">
        <HeroIcon />
        <TitleSection />

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`relative upload-area-cyberpunk p-4 sm:p-8 md:p-12 lg:p-16 text-center cursor-pointer transition-all duration-500 mb-12 group ${isDragActive ? "scale-105 border-cyan-400 shadow-cyan-400/25" : ""
            }`}
        >
          <input {...getInputProps()} />

          {/* Corner accents */}
          {[
            { position: "top-2 left-2", borders: "border-l-2 border-t-2", color: "border-cyan-400" },
            { position: "top-2 right-2", borders: "border-r-2 border-t-2", color: "border-pink-400" },
            { position: "bottom-2 left-2", borders: "border-l-2 border-b-2", color: "border-pink-400" },
            { position: "bottom-2 right-2", borders: "border-r-2 border-b-2", color: "border-cyan-400" }
          ].map((accent, i) => (
            <div
              key={i}
              className={`absolute ${accent.position} w-6 h-6 ${accent.borders} ${accent.color} opacity-60 group-hover:opacity-100 transition-opacity`}
            />
          ))}

          <div className="mb-8 relative">
            <div className="relative inline-block">
              <Upload className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-purple-400 mx-auto mb-4 sm:mb-6 transition-all duration-300 ${isDragActive ? "text-cyan-400 scale-110" : "group-hover:text-pink-400"
                }`} />
              {isDragActive && (
                <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto border-2 border-cyan-400 rounded-full animate-ping opacity-60" />
              )}
            </div>

            {hasFiles ? (
              <div className="space-y-4">
                <p className="text-white text-base sm:text-lg md:text-xl font-medium mb-4 sm:mb-6">
                  <File className="inline w-5 h-5 mr-2 text-cyan-400" />
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
                    <span className="text-cyan-400 animate-pulse">Drop your .xd files here</span>
                  ) : (
                    "Drag & drop your .xd files"
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

        <DecryptButton
          isDisabled={isButtonDisabled}
          isProcessing={isProcessing}
          fileCount={files.length}
          hasPassword={hasPassword}
          onClick={handleDecrypt}
        />
      </div>
    </div>
  )
}