"use client"

import { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
	Unlock, Upload, Eye, KeyRound, Shield, Zap, File, Key, ToggleLeft, ToggleRight
} from "lucide-react"
import { formatFileSize } from "@/app/utils"
import { DecryptStatusHelper } from "@/app/utils/status-helper"
import {
	isHumanReadableFormat,
	getBase64FromHuman,
	validateBase64Key
} from "@/app/utils/crypto"
import type { DecryptFileStatus, DecryptButtonProps, FileListItemProps, PasswordInputProps } from "@/app/types"

// Constants
const DECRYPTION_ENDPOINT = "/decrypt"
const ACCEPTED_FILE_TYPES = { "application/octet-stream": [".xd"] }
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

const extractFilenameFromHeader = (disposition: string): string => {
	// Try robust regex first
	let match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";\r\n]*)/i)
	if (match) {
		const filename = decodeURIComponent(match[1].trim())
		return filename
	}

	// Fallback: quoted value
	match = disposition.match(/filename="([^"]+)"/i)
	if (match) {
		const filename = match[1]
		return filename
	}

	return "decrypted.bin"
}

const getErrorMessage = (status: number, errorText?: string): string => {
	switch (status) {
		case 401:
			return "Wrong password/key or file is corrupt"
		case 400:
			return errorText || "Invalid request"
		default:
			return `Error (${status})`
	}
}

// Helper function to validate Base64 format
const isValidBase64 = (str: string): boolean => {
	try {
		// Check if it matches Base64 pattern
		const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/
		if (!base64Pattern.test(str)) {
			return false
		}

		// Try to decode it
		atob(str)
		return true
	} catch {
		return false
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

const ModeToggle = ({ useKey, onToggle }: { useKey: boolean, onToggle: (useKey: boolean) => void }) => (
	<div className="mb-6">
		<div className="flex items-center justify-center gap-4 p-4 bg-gradient-to-r from-zinc-900/40 to-zinc-800/40 rounded-2xl border border-purple-400/20">
			<div className={`flex items-center gap-2 transition-all duration-300 ${!useKey ? 'text-pink-400' : 'text-gray-500'}`}>
				<KeyRound className="w-5 h-5" />
				<span className="font-medium">Password</span>
			</div>

			<button
				onClick={() => onToggle(!useKey)}
				className="relative p-1 transition-all duration-300 hover:scale-110"
			>
				{useKey ? (
					<ToggleRight className="w-8 h-8 text-cyan-400" />
				) : (
					<ToggleLeft className="w-8 h-8 text-gray-400" />
				)}
			</button>

			<div className={`flex items-center gap-2 transition-all duration-300 ${useKey ? 'text-cyan-400' : 'text-gray-500'}`}>
				<Key className="w-5 h-5" />
				<span className="font-medium">Encryption Key</span>
			</div>
		</div>
	</div>
)

const PasswordInput = ({ password, onChange }: PasswordInputProps) => (
	<div className="mb-8">
		<div className="relative group">
			<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400 pointer-events-none z-10 group-focus-within:text-pink-400 transition-colors duration-300" />
			<input
				type="password"
				placeholder="Enter your password"
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

const KeyInput = ({ encryptionKey, onChange }: { encryptionKey: string, onChange: (key: string) => void }) => {
	const isHumanFormat = isHumanReadableFormat(encryptionKey)
	const hasMapping = isHumanFormat ? getBase64FromHuman(encryptionKey) !== null : false
	const isValidBase64Key = !isHumanFormat && encryptionKey.length > 0 ? isValidBase64(encryptionKey) : true
	const isValidSize = !isHumanFormat && encryptionKey.length > 0 && isValidBase64Key ? validateBase64Key(encryptionKey) : true

	const getValidationState = () => {
		if (encryptionKey.length === 0) return 'empty'
		if (isHumanFormat) return hasMapping ? 'valid-human' : 'invalid-human'
		if (!isValidBase64Key) return 'invalid-base64'
		if (!isValidSize) return 'invalid-size'
		return 'valid-base64'
	}

	const validationState = getValidationState()

	return (
		<div className="mb-8">
			<div className="relative group">
				<Key className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400 pointer-events-none z-10 group-focus-within:text-pink-400 transition-colors duration-300" />
				<input
					type="text"
					placeholder="Enter encryption key (Base64 or human-readable format)"
					value={encryptionKey}
					onChange={(e) => onChange(e.target.value)}
					className={`w-full bg-gradient-to-r from-zinc-900/60 to-zinc-800/40 border rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-gray-400 focus:ring-2 transition-all duration-300 text-base sm:text-lg backdrop-blur-sm group relative z-0 ${validationState === 'valid-human' ? 'border-green-400/30 focus:ring-green-500 focus:border-green-500 hover:border-green-400/50 font-bold' :
							validationState === 'invalid-human' ? 'border-red-400/30 focus:ring-red-500 focus:border-red-500 hover:border-red-400/50 font-bold' :
								validationState === 'valid-base64' ? 'border-green-400/30 focus:ring-green-500 focus:border-green-500 hover:border-green-400/50 font-mono' :
									validationState === 'invalid-base64' ? 'border-red-400/30 focus:ring-red-500 focus:border-red-500 hover:border-red-400/50 font-mono' :
										validationState === 'invalid-size' ? 'border-orange-400/30 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-400/50 font-mono' :
											'border-cyan-400/30 focus:ring-cyan-500 focus:border-cyan-500 hover:border-cyan-400/50 font-mono'
						}`}
				/>
				<div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
					<div className="absolute top-0 left-1/4 w-8 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
					<div className="absolute bottom-0 right-1/4 w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
				</div>
			</div>

			<div className="mt-3 pl-4 flex items-start gap-2">
				<div className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 animate-pulse ${validationState === 'valid-human' || validationState === 'valid-base64' ? 'bg-green-400' :
						validationState === 'invalid-size' ? 'bg-orange-400' :
							validationState.startsWith('invalid') ? 'bg-red-400' : 'bg-cyan-400'
					}`} />
				<div>
					<p className="text-sm text-gray-500 leading-relaxed">
						{validationState === 'empty' && (
							'Paste the Base64 encryption key or human-readable format (e.g., DRAGON-MANGO-FOREST-12345).'
						)}
						{validationState === 'valid-human' && (
							<span className="text-green-400">
								✓ Valid human-readable key! Ready to decrypt.
							</span>
						)}
						{validationState === 'invalid-human' && (
							<span className="text-red-400">
								⚠️ Invalid human-readable format. Check your key format.
							</span>
						)}
						{validationState === 'valid-base64' && (
							<span className="text-green-400">
								✓ Valid Base64 key! Ready to decrypt.
							</span>
						)}
						{validationState === 'invalid-base64' && (
							<span className="text-red-400">
								⚠️ Invalid Base64 format. Please check your encryption key.
							</span>
						)}
						{validationState === 'invalid-size' && (
							<span className="text-orange-400">
								⚠️ Invalid key size. Expected 32 bytes, got {(() => {
									try {
										return atob(encryptionKey).length
									} catch {
										return 'unknown'
									}
								})()} bytes.
							</span>
						)}
					</p>

					{isHumanFormat && (
						<div className={`mt-2 p-2 rounded text-xs ${hasMapping
								? 'bg-green-900/20 border border-green-400/30 text-green-300'
								: 'bg-red-900/20 border border-red-400/30 text-red-300'
							}`}>
							<strong>{hasMapping ? '🎉' : '⚠️'}</strong> {hasMapping
								? 'Perfect! This human-readable key will work for decryption.'
								: 'Invalid format. Human-readable keys should be like: WORD1-WORD2-WORD3-NNNNN (e.g., DRAGON-MANGO-FOREST-12345)'
							}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

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

/**
 * Renders a user interface for decrypting `.xd` files with optional password protection.
 *
 * Allows users to select or drag-and-drop multiple files, enter a password if needed, and initiate decryption. Displays the status of each file during processing and automatically downloads decrypted files upon success. Handles error reporting and disables UI elements appropriately during decryption.
 */
export function DecryptForm() {
	const [files, setFiles] = useState<File[]>([])
	const [password, setPassword] = useState("")
	const [encryptionKey, setEncryptionKey] = useState("")
	const [useKey, setUseKey] = useState(false)
	const [status, setStatus] = useState<DecryptFileStatus>({})
	const [isProcessing, setIsProcessing] = useState(false)
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

	// Helper function to show toast notifications
	const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
		setToast({ message, type })
		setTimeout(() => setToast(null), duration)
	}, [])

	// Memoized values
	const hasFiles = useMemo(() => files.length > 0, [files.length])
	const hasPassword = useMemo(() => password.length > 0, [password.length])
	const hasKey = useMemo(() => encryptionKey.length > 0, [encryptionKey.length])
	const hasCredentials = useMemo(() => useKey ? hasKey : hasPassword, [useKey, hasKey, hasPassword]) // Allow any key format
	const isButtonDisabled = useMemo(() => !hasFiles || isProcessing || !hasCredentials, [hasFiles, isProcessing, hasCredentials])

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

			// Parse specific error messages from backend
			if (xhr.status === 400) {
				if (errorText.includes('Invalid encryption key format')) {
					return '⚠️ Invalid encryption key format. Please check your Base64 key or try the human-readable format.'
				}
				if (errorText.includes('Invalid encryption key size')) {
					return '⚠️ Invalid encryption key size. Please verify your key is correct.'
				}
				if (errorText.includes('Password must be at least')) {
					return '⚠️ Password is too short. Please use at least 8 characters.'
				}
				if (errorText.includes('Password cannot be empty')) {
					return '⚠️ Password cannot be empty. Please enter your password.'
				}
				return errorText || 'Invalid request. Please check your input.'
			}

			if (xhr.status === 401) {
				return '❌ Wrong password/key or the file is corrupted. Please verify your credentials.'
			}

			return getErrorMessage(xhr.status, errorText)
		} catch {
			return getErrorMessage(xhr.status)
		}
	}, [])
	const decryptSingleFile = useCallback((file: File): Promise<void> => {
		return new Promise((resolve, reject) => {
			let actualKey = encryptionKey

			// Validate key format before sending to backend
			if (useKey && hasKey) {
				// Check if it's human-readable format
				if (isHumanReadableFormat(encryptionKey)) {
					const base64Key = getBase64FromHuman(encryptionKey)
					if (base64Key) {
						actualKey = base64Key
						// Show success toast
						showToast('🎉 Human-readable key successfully converted!', 'success')
					} else {
						reject(new Error('⚠️ Invalid human-readable key format. Please check the format (e.g., DRAGON-MANGO-FOREST-12345) or use the Base64 key from your backup.'))
						return
					}
				} else {
					// Validate Base64 format
					if (!isValidBase64(encryptionKey)) {
						const errorMsg = '⚠️ Invalid Base64 key format. Please check your encryption key or use the human-readable format instead.'
						showToast(errorMsg, 'error')
						reject(new Error(errorMsg))
						return
					}

					// Validate Base64 key size
					try {
						const decoded = atob(encryptionKey)
						if (decoded.length !== 32) {
							const errorMsg = `⚠️ Invalid key size. Expected 32 bytes, got ${decoded.length} bytes. Please check your encryption key.`
							showToast(errorMsg, 'error')
							reject(new Error(errorMsg))
							return
						}
					} catch (e) {
						const errorMsg = '⚠️ Invalid Base64 key format. Please check your encryption key.'
						showToast(errorMsg, 'error')
						reject(new Error(errorMsg))
						return
					}

					actualKey = encryptionKey
				}
			}

			const xhr = new XMLHttpRequest()
			const url = `${BACKEND_URL}${DECRYPTION_ENDPOINT}`

			xhr.open("POST", url)
			xhr.setRequestHeader("Content-Type", "application/octet-stream")

			// Set appropriate header based on mode
			if (useKey && hasKey) {
				xhr.setRequestHeader("x-enc-key", actualKey)
			} else if (hasPassword) {
				xhr.setRequestHeader("x-password", password)
			}

			xhr.responseType = "blob"

			xhr.onload = () => {
				if (xhr.status === 200) {
					downloadFile(xhr.response, xhr)
					showToast('✅ File decrypted successfully!', 'success')
					resolve()
				} else {
					handleDecryptError(xhr)
						.then((errorMessage) => {
							showToast(errorMessage, 'error', 5000) // Show error toast for longer
							reject(new Error(errorMessage))
						})
						.catch(() => {
							const errorMsg = getErrorMessage(xhr.status)
							showToast(errorMsg, 'error', 5000)
							reject(new Error(errorMsg))
						})
				}
			}

			xhr.onerror = () => {
				const errorMsg = "Network error. Please check your connection and try again."
				showToast(errorMsg, 'error')
				reject(new Error(errorMsg))
			}

			file.arrayBuffer()
				.then((buffer) => {
					xhr.send(buffer)
				})
				.catch(() => {
					const errorMsg = "Failed to read file. Please try selecting the file again."
					showToast(errorMsg, 'error')
					reject(new Error(errorMsg))
				})
		})
	}, [useKey, hasKey, encryptionKey, hasPassword, password, downloadFile, handleDecryptError, showToast])

	const handleDecrypt = useCallback(async () => {
		if (!hasFiles) return

		setIsProcessing(true)
		const newStatus: DecryptFileStatus = {}

		for (const file of files) {
			try {
				const statusKey = hasCredentials ? 'verifying' : 'decrypting'
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
	}, [hasFiles, hasCredentials, files, decryptSingleFile])

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

				<ModeToggle useKey={useKey} onToggle={setUseKey} />

				{useKey ? (
					<KeyInput encryptionKey={encryptionKey} onChange={setEncryptionKey} />
				) : (
					<PasswordInput password={password} onChange={setPassword} />
				)}

				<DecryptButton
					isDisabled={isButtonDisabled}
					isProcessing={isProcessing}
					fileCount={files.length}
					hasPassword={hasCredentials}
					onClick={handleDecrypt}
				/>

				{useKey && hasKey && isHumanReadableFormat(encryptionKey) && (
					<div className={`mt-4 p-3 rounded-xl text-center ${getBase64FromHuman(encryptionKey)
							? 'bg-green-900/20 border border-green-400/30'
							: 'bg-red-900/20 border border-red-400/30'
						}`}>
						<p className={`text-sm ${getBase64FromHuman(encryptionKey) ? 'text-green-300' : 'text-red-300'
							}`}>
							{getBase64FromHuman(encryptionKey) ? (
								<>🎉 <strong>Perfect!</strong> This human-readable key is ready for decryption!</>
							) : (
								<>⚠️ <strong>Invalid format!</strong> Please check your human-readable key format.</>
							)}
						</p>
					</div>
				)}

				{/* Toast Notification */}
				{toast && (
					<div className={`fixed top-4 right-4 z-[9999] text-white px-6 py-3 rounded-lg shadow-2xl transform transition-all duration-300 ease-out animate-bounce ${toast.type === 'success' ? 'bg-green-600' :
							toast.type === 'error' ? 'bg-red-600' :
								'bg-blue-600'
						}`}>
						<div className="flex items-center gap-2">
							<div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-green-300' :
									toast.type === 'error' ? 'bg-red-300' :
										'bg-blue-300'
								}`} />
							<span className="font-medium">{toast.message}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
