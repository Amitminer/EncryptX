"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
	Lock, Upload, Eye, KeyRound, Shield, Zap, File, Cpu, Copy, AlertTriangle, Download
} from "lucide-react"
import { toast } from "sonner"
import { formatFileSize } from "@/app/utils"
import { EncryptStatusHelper } from "@/app/utils/status-helper"
import { generateKeysPDF } from "@/app/utils/pdf"
import { convertToHumanReadable } from "@/app/utils/crypto"
import { EncryptFileStatus, EncryptButtonProps, PasswordInputProps, FileListItemProps } from "@/app/types"

// Constants
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
const ENCRYPTION_ENDPOINT = "/encrypt"
const ENCRYPTED_FILE_EXTENSION = ".xd"

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
	<div className="flex justify-center mb-8 sm:mb-10 md:mb-12 relative">
		<div className="relative">
			<div
				className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border-2 border-pink-400/20 rounded-full animate-spin"
				style={{ animationDirection: 'reverse' }}
			/>
			<div className="absolute inset-2 w-16 h-16 sm:w-20 sm:h-20 border border-cyan-400/30 rounded-full animate-pulse" />
			<div className="p-4 sm:p-6 rounded-full hero-lock-glow relative z-10 bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-sm">
				<Lock className="w-8 h-8 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
			</div>
			<Shield className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 text-pink-400 animate-bounce opacity-70" />
			<Cpu className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse opacity-60" />
		</div>
	</div>
)

const TitleSection = () => (
	<div className="text-center mb-8 sm:mb-10 md:mb-12">
		<div className="relative inline-block">
			<p className="text-white text-xl sm:text-2xl mb-3 font-bold tracking-wider relative z-10">
				ENCRYPT FILES
				<span className="absolute inset-0 text-pink-400 opacity-20 translate-x-0.5 translate-y-0.5 pointer-events-none">
					ENCRYPT FILES
				</span>
			</p>
		</div>
		<div className="flex items-center justify-center gap-2">
			<div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-400" />
			<p className="text-cyan-400 font-medium text-sm sm:text-lg px-3 sm:px-4 bg-zinc-900/40 rounded-full py-1 border border-cyan-400/20">
				Supports all file types
			</p>
			<div className="w-6 sm:w-8 h-0.5 bg-gradient-to-l from-transparent to-cyan-400" />
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
				Leave empty to auto-generate a secure key. <strong className="text-amber-400">You&apos;ll need to save the generated key to decrypt your files later!</strong>
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

const GeneratedKeysDisplay = ({
	generatedKeys,
	onCopyKey,
	onGeneratePDF,
	showHumanReadable,
	onToggleFormat
}: {
	generatedKeys: { [fileName: string]: string },
	onCopyKey: (key: string, fileName: string, format?: string) => void,
	onGeneratePDF: () => void,
	showHumanReadable: { [fileName: string]: boolean },
	onToggleFormat: (fileName: string) => void
}) => {
	if (Object.keys(generatedKeys).length === 0) return null

	return (
		<div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-400/30 rounded-2xl backdrop-blur-sm">
			{/* Mobile-first header layout */}
			<div className="mb-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
					<div className="flex items-center gap-2 sm:gap-3">
						<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse flex-shrink-0" />
						<h3 className="text-base sm:text-xl font-bold text-amber-400 leading-tight">
							⚠️ IMPORTANT: Save Your Encryption Keys!
						</h3>
					</div>

					<Button
						onClick={onGeneratePDF}
						className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center sm:flex-shrink-0 text-sm sm:text-base"
					>
						<Download className="w-4 h-4" />
						PDF Backup
					</Button>
				</div>
			</div>

			<p className="text-amber-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
				Your files were encrypted with auto-generated keys. <strong>You MUST save these keys to decrypt your files later!</strong>
				These keys are not stored anywhere and cannot be recovered if lost.
			</p>

			<div className="space-y-3 sm:space-y-4">
				{Object.entries(generatedKeys).map(([fileName, key]) => {
					const isHumanReadable = showHumanReadable[fileName] !== false // Default to true (human-readable)
					const displayKey = isHumanReadable ? convertToHumanReadable(key) : key

					return (
						<div key={fileName} className="bg-zinc-900/60 border border-amber-400/20 rounded-xl p-3 sm:p-4">
							{/* Mobile-optimized file header */}
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
								<span className="text-amber-300 font-medium text-sm flex items-center">
									<File className="inline w-4 h-4 mr-2 flex-shrink-0" />
									<span className="truncate">{fileName}</span>
								</span>

								<div className="flex items-center gap-2 self-start sm:self-auto">
									<span className="text-xs text-gray-400 flex-shrink-0">
										{isHumanReadable ? 'Words Format' : 'Base64 Format'}
									</span>
									<Button
										onClick={() => onToggleFormat(fileName)}
										className="bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 py-1 rounded text-xs transition-colors duration-200 flex-shrink-0"
									>
										{isHumanReadable ? 'Show Base64' : 'Show Words'}
									</Button>
								</div>
							</div>

							{/* Mobile-optimized key display */}
							<div className="flex flex-col sm:flex-row sm:items-center gap-3">
								<div className="flex-1 bg-zinc-800/80 border border-zinc-600 rounded-lg p-2 sm:p-3 font-mono text-xs sm:text-sm text-white break-all min-h-[3rem] sm:min-h-0">
									{displayKey}
								</div>
								<Button
									onClick={() => onCopyKey(displayKey, fileName, isHumanReadable ? 'human-readable' : 'base64')}
									className="bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center w-full sm:w-auto sm:flex-shrink-0 text-sm"
									title={isHumanReadable ? "Copy human-readable key" : "Copy Base64 key"}
								>
									<Copy className="w-4 h-4" />
									{isHumanReadable ? 'Copy Words' : 'Copy Key'}
								</Button>
							</div>

							{isHumanReadable && (
								<div className="mt-2 p-2 bg-blue-900/20 border border-blue-400/30 rounded text-xs text-blue-300">
									<strong>💡 Tip:</strong> This word format is easier to remember! The copy button copies the human-readable version. Use &ldquo;Show Base64&rdquo; to copy the technical key for decryption.
								</div>
							)}
						</div>
					)
				})}
			</div>

			<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-900/20 border border-red-400/30 rounded-xl">
				<p className="text-red-300 text-xs sm:text-sm leading-relaxed">
					<strong>⚠️ Security Warning:</strong> Store these keys in a secure location (password manager, encrypted file, etc.).
					Without these keys, your encrypted files cannot be decrypted!
				</p>
			</div>
		</div>
	)
}

/** File encryption form with drag-and-drop, password input, and progress tracking */
export function EncryptForm() {
	const [files, setFiles] = useState<File[]>([])
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<EncryptFileStatus>({})
	const [isProcessing, setIsProcessing] = useState(false)
	const [generatedKeys, setGeneratedKeys] = useState<{ [fileName: string]: string }>({})
	const [showKeys, setShowKeys] = useState(false)
	const [showHumanReadable, setShowHumanReadable] = useState<{ [fileName: string]: boolean }>({})

	// Ref for auto-scrolling to keys section
	const keysRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to keys section when they appear
	useEffect(() => {
		if (showKeys && keysRef.current) {
			// Small delay to ensure the component is fully rendered
			setTimeout(() => {
				if (keysRef.current) {
					// Calculate offset to account for mobile navigation
					const offset = window.innerWidth < 768 ? 80 : 100
					const elementTop = keysRef.current.getBoundingClientRect().top + window.pageYOffset
					const offsetPosition = elementTop - offset

					window.scrollTo({
						top: offsetPosition,
						behavior: 'smooth'
					})
				}
			}, 200)
		}
	}, [showKeys])

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
			// Use password-based encryption
			xhr.setRequestHeader("x-password", password)
			// Explicitly do NOT set x-enc-key header for password-based encryption
		} else {
			// Use key-based encryption with auto-generated key
			// Don't send x-enc-key header - let backend generate the key
		}

			xhr.responseType = "blob"

			xhr.onload = () => {
				if (xhr.status === 200) {
					// Check for generated key in response headers
					const generatedKey = xhr.getResponseHeader("x-generated-key")
					if (generatedKey && !password) {
						setGeneratedKeys(prev => ({
							...prev,
							[file.name]: generatedKey
						}))
						setShowKeys(true)
						toast.warning('⚠️ Please save your encryption key!', {
							description: `File ${file.name} encrypted successfully. Check below for your keys!`,
							duration: 6000
						})
					}

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

	const handleGeneratePDF = useCallback(async () => {
		try {
			await generateKeysPDF({
				generatedKeys,
				companyName: 'EncryptX',
				includeInstructions: true
			})

			toast.success('PDF backup generated successfully!', {
				description: 'Your encryption keys have been saved to a PDF file'
			})

		} catch (error) {
			console.error('Error generating PDF:', error)
			toast.error('Error generating PDF backup', {
				description: 'Please try again or save your keys manually'
			})
		}
	}, [generatedKeys])

	const handleToggleFormat = useCallback((fileName: string) => {
		setShowHumanReadable(prev => {
			const currentValue = prev[fileName] !== false // Default is true (human-readable)
			return {
				...prev,
				[fileName]: !currentValue
			}
		})
	}, [])

	const handleCopyKey = useCallback(async (key: string, fileName: string, format: string = 'base64') => {
		try {
			// Modern clipboard API
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(key)
				const formatText = format === 'human-readable' ? 'human-readable' : 'Base64'
				toast.success(`🎉 ${formatText} key copied for ${fileName}!`, {
					description: `${formatText} encryption key copied to clipboard`
				})
				return
			}

			// Fallback method
			const textArea = document.createElement('textarea')
			textArea.value = key
			textArea.style.position = 'fixed'
			textArea.style.left = '-999999px'
			textArea.style.top = '-999999px'
			document.body.appendChild(textArea)
			textArea.focus()
			textArea.select()

			const successful = document.execCommand('copy')
			document.body.removeChild(textArea)

			if (successful) {
				const formatText = format === 'human-readable' ? 'human-readable' : 'Base64'
				toast.success(`🎉 ${formatText} key copied for ${fileName}!`, {
					description: `${formatText} encryption key copied to clipboard`
				})
			} else {
				throw new Error('Copy command failed')
			}

		} catch (error) {
			console.error('Copy failed:', error)
			toast.error(`❌ Failed to copy key for ${fileName}`, {
				description: 'Please copy the key manually from the display above'
			})

			// Last resort - show the key in an alert
			alert(`Copy failed! Here's your key for ${fileName}:\\n\\n${key}\\n\\nPlease copy this manually.`)
		}
	}, [])

	const handleEncrypt = useCallback(async () => {
		if (!hasFiles) return

		setIsProcessing(true)
		setGeneratedKeys({}) // Clear previous keys
		setShowKeys(false)
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

			<div className="card-cyberpunk p-4 sm:p-6 md:p-10 lg:p-12 max-w-2xl lg:max-w-4xl mx-auto relative z-10 m-4 sm:m-6 md:m-8">
				<HeroIcon />
				<TitleSection />

				{/* File Upload Area */}
				<div
					{...getRootProps()}
					className={`relative upload-area-cyberpunk p-4 sm:p-6 md:p-8 lg:p-10 text-center cursor-pointer transition-all duration-500 mb-8 sm:mb-10 md:mb-12 rounded-2xl border border-pink-700/40 bg-zinc-900/70 shadow-inner group ${isDragActive ? "scale-105 ring-2 ring-pink-500 border-pink-400 shadow-pink-400/25" : ""
						}`}
					style={{ minHeight: 140 }}
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

				{showKeys && (
					<div ref={keysRef} className="animate-in slide-in-from-bottom-4 duration-500">
						<GeneratedKeysDisplay
							generatedKeys={generatedKeys}
							onCopyKey={handleCopyKey}
							onGeneratePDF={handleGeneratePDF}
							showHumanReadable={showHumanReadable}
							onToggleFormat={handleToggleFormat}
						/>
					</div>
				)}
			</div>
		</div>
	)
}
