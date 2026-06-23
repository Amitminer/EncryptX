"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
	Lock, Upload, Eye, KeyRound, Shield, File, Copy, AlertTriangle, Download, X
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

const HeroIcon = () => (
	<div className="flex justify-center mb-6">
		<div className="p-4 rounded-xl bg-slate-900 border border-slate-850 shadow-sm">
			<Lock className="w-8 h-8 text-indigo-400" />
		</div>
	</div>
)

const TitleSection = () => (
	<div className="text-center mb-8">
		<h2 className="text-xl font-bold tracking-tight text-white mb-2">
			Encrypt Files
		</h2>
		<p className="text-sm text-slate-400">
			Supports all file types. Military-grade secure AES-256 encryption.
		</p>
	</div>
)

const FileListItem = ({ file, status, onRemove }: FileListItemProps) => (
	<div className="flex items-center gap-3 bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-800 hover:border-slate-700 transition-all duration-200">
		<File className="w-4 h-4 text-indigo-400 flex-shrink-0" />
		<span className="truncate flex-1 text-slate-200 text-sm font-medium text-left">
			{file.name}
		</span>
		<span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full flex-shrink-0">
			{formatFileSize(file.size)} MB
		</span>

		{status && (
			<div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
				{EncryptStatusHelper.getStatusIcon(status)}
				<span className={`text-xs font-semibold ${EncryptStatusHelper.getStatusColor(status)}`}>
					{status}
				</span>
			</div>
		)}

		<button
			type="button"
			aria-label={`Remove ${file.name}`}
			className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all duration-200 flex-shrink-0 ml-1"
			onClick={(e) => {
				e.stopPropagation()
				onRemove(file.name)
			}}
			disabled={status === 'encrypting'}
		>
			<X className="w-4 h-4" />
		</button>
	</div>
)

const PasswordInput = ({ password, onChange }: PasswordInputProps) => (
	<div className="mb-6 text-left">
		<div className="relative">
			<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
			<input
				type="password"
				placeholder="Encryption Password (optional but recommended)"
				value={password}
				onChange={(e) => onChange(e.target.value)}
				className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3.5 pl-12 pr-4 text-slate-250 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-200"
			/>
		</div>
		<p className="mt-2 text-xs text-slate-500">
			Leave empty to auto-generate a secure key. <strong className="text-amber-500">You&apos;ll need to save the generated key to decrypt your files later!</strong>
		</p>
	</div>
)

const EncryptButton = ({ isDisabled, isProcessing, fileCount, onClick }: EncryptButtonProps) => (
	<Button
		onClick={onClick}
		disabled={isDisabled}
		variant="ghost"
		className="w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm border-0 bg-indigo-600 hover:bg-indigo-700 text-white"
	>
		{isProcessing ? (
			<>
				<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
				<span>Encrypting...</span>
			</>
		) : (
			<>
				<Lock className="w-4 h-4" />
				<span>{fileCount >= 1 ? "Encrypt & Download All" : "Encrypt & Download"}</span>
			</>
		)}
	</Button>
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
		<div className="mt-5 p-4 bg-amber-955/20 border border-amber-900/40 rounded-xl text-left">
			<div className="flex items-center justify-between gap-2.5 mb-3 flex-wrap sm:flex-nowrap">
				<div className="flex items-center gap-1.5">
					<AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
					<h3 className="text-xs sm:text-sm font-bold text-amber-500">
						Save Encryption Keys!
					</h3>
				</div>

				<Button
					onClick={onGeneratePDF}
					variant="ghost"
					className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 px-2.5 py-1 h-8 rounded-lg flex items-center gap-1 text-[10px] font-semibold flex-shrink-0 cursor-pointer"
				>
					<Download className="w-3 h-3" />
					PDF Backup
				</Button>
			</div>

			<p className="text-slate-455 text-[11px] sm:text-xs mb-3.5 leading-relaxed">
				Auto-generated keys are required to decrypt files later. Save them now as they cannot be recovered.
			</p>

			<div className="space-y-2.5">
				{Object.entries(generatedKeys).map(([fileName, key]) => {
					const isHumanReadable = showHumanReadable[fileName] !== false
					const displayKey = isHumanReadable ? convertToHumanReadable(key) : key

					return (
						<div key={fileName} className="bg-slate-955 border border-slate-900 rounded-lg p-2.5">
							<div className="flex items-center justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap">
								<span className="text-amber-550/90 font-medium text-[11px] flex items-center truncate max-w-[130px] sm:max-w-xs">
									<File className="w-3 h-3 mr-1 flex-shrink-0" />
									<span className="truncate">{fileName}</span>
								</span>

								<div className="flex items-center gap-1.5">
									<span className="text-[10px] text-slate-500 font-medium">
										{isHumanReadable ? 'Words' : 'Base64'}
									</span>
									<Button
										onClick={() => onToggleFormat(fileName)}
										variant="ghost"
										className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 px-2 py-0.5 h-6 rounded text-[9px] font-bold cursor-pointer"
									>
										{isHumanReadable ? 'Show Base64' : 'Show Words'}
									</Button>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<div className="flex-1 bg-slate-900 border border-slate-850 rounded-lg p-2 font-mono text-[10px] sm:text-xs text-slate-200 break-all select-all min-h-[36px] flex items-center">
									{displayKey}
								</div>
								<Button
									onClick={() => onCopyKey(displayKey, fileName, isHumanReadable ? 'human-readable' : 'base64')}
									variant="ghost"
									className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg flex items-center justify-center flex-shrink-0 h-9 w-9 cursor-pointer"
									title="Copy Key"
								>
									<Copy className="w-4 h-4" />
								</Button>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export function EncryptForm() {
	const [files, setFiles] = useState<File[]>([])
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<EncryptFileStatus>({})
	const [isProcessing, setIsProcessing] = useState(false)
	const [generatedKeys, setGeneratedKeys] = useState<{ [fileName: string]: string }>({})
	const [showKeys, setShowKeys] = useState(false)
	const [showHumanReadable, setShowHumanReadable] = useState<{ [fileName: string]: boolean }>({})

	const keysRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (showKeys && keysRef.current) {
			setTimeout(() => {
				if (keysRef.current) {
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
			if (password) {
				if (password.length < 4) {
					reject(new Error('Password must be at least 4 characters long'))
					return
				}
				if (password.length > 1024) {
					reject(new Error('Password is too long (maximum 1024 characters)'))
					return
				}
			}

			if (file.name.length > 255) {
				reject(new Error('Filename is too long'))
				return
			}

			const dangerousChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
			if (dangerousChars.some(char => file.name.includes(char))) {
				reject(new Error('Filename contains invalid characters'))
				return
			}

			if (file.name.includes('..')) {
				reject(new Error('Filename cannot contain ".."'))
				return
			}

			const xhr = new XMLHttpRequest()
			const url = `${BACKEND_URL}${ENCRYPTION_ENDPOINT}`

			xhr.open("POST", url)
			xhr.setRequestHeader("Content-Type", "application/octet-stream")
			xhr.setRequestHeader("x-orig-filename", file.name)

			if (password) {
				xhr.setRequestHeader("x-password", password)
			}

			xhr.responseType = "blob"

			xhr.onload = () => {
				if (xhr.status === 200) {
					const generatedKey = xhr.getResponseHeader("x-generated-key")
					if (generatedKey && !password) {
						setGeneratedKeys(prev => ({
							...prev,
							[file.name]: generatedKey
						}))
						setShowKeys(true)
						toast.warning('Save your encryption key!', {
							description: `File ${file.name} encrypted. Save the key below!`,
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
			toast.success('PDF backup generated successfully!')
		} catch (error) {
			console.error('Error generating PDF:', error)
			toast.error('Error generating PDF backup')
		}
	}, [generatedKeys])

	const handleToggleFormat = useCallback((fileName: string) => {
		setShowHumanReadable(prev => {
			const currentValue = prev[fileName] !== false
			return {
				...prev,
				[fileName]: !currentValue
			}
		})
	}, [])

	const handleCopyKey = useCallback(async (key: string, fileName: string, format: string = 'base64') => {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(key)
				const formatText = format === 'human-readable' ? 'words' : 'Base64'
				toast.success(`Key copied for ${fileName}!`)
				return
			}

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
				toast.success(`Key copied for ${fileName}!`)
			} else {
				throw new Error('Copy command failed')
			}
		} catch (error) {
			console.error('Copy failed:', error)
			toast.error(`Failed to copy key for ${fileName}`)
			alert(`Copy failed! Here's your key: \n\n${key}`)
		}
	}, [])

	const handleEncrypt = useCallback(async () => {
		if (!hasFiles) return

		setIsProcessing(true)
		setGeneratedKeys({})
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
		<div className="card-form-subtle p-5 sm:p-6 max-w-xl mx-auto my-4 text-center">
			<HeroIcon />
			<TitleSection />

			{/* File Upload Area */}
			<div
				{...getRootProps()}
				className={`relative upload-area-subtle p-5 sm:p-6 cursor-pointer mb-6 rounded-xl border border-slate-800 ${
					isDragActive ? "ring-2 ring-indigo-500 border-indigo-500 bg-slate-900/60" : ""
				}`}
				style={{ minHeight: 140 }}
			>
				<input {...getInputProps()} />

				<div className="mb-4">
					<Upload className={`w-8 h-8 text-indigo-400 mx-auto mb-3 transition-colors ${
						isDragActive ? "text-indigo-300" : ""
					}`} />

					{hasFiles ? (
						<div className="space-y-4">
							<p className="text-white text-sm font-semibold mb-2">
								Selected Files:
							</p>
							<div className="max-h-60 overflow-y-auto space-y-2 pr-1">
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
						<div className="space-y-2">
							<p className="text-white text-sm sm:text-base font-semibold">
								{isDragActive ? "Drop your files here" : "Drag & drop your files here"}
							</p>
							<p className="text-slate-400 text-xs sm:text-sm">or click to browse files</p>
						</div>
					)}
				</div>

				{!hasFiles && (
					<Button className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
						<Eye className="w-4 h-4 mr-1.5" />
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
				<div ref={keysRef}>
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
	)
}
