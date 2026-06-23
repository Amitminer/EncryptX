"use client"

import { useState, useCallback, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/app/ui/button"
import {
	Unlock, Upload, Eye, KeyRound, Shield, File, Key, X
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
	let match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";\r\n]*)/i)
	if (match) {
		return decodeURIComponent(match[1].trim())
	}

	match = disposition.match(/filename="([^"]+)"/i)
	if (match) {
		return match[1]
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

const isValidBase64 = (str: string): boolean => {
	try {
		const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/
		if (!base64Pattern.test(str)) {
			return false
		}
		atob(str)
		return true
	} catch {
		return false
	}
}

const HeroIcon = () => (
	<div className="flex justify-center mb-6">
		<div className="p-4 rounded-xl bg-slate-900 border border-slate-850 shadow-sm">
			<Unlock className="w-8 h-8 text-emerald-400" />
		</div>
	</div>
)

const TitleSection = () => (
	<div className="text-center mb-8">
		<h2 className="text-xl font-bold tracking-tight text-white mb-2">
			Decrypt Files
		</h2>
		<p className="text-sm text-slate-400">
			Only .xd files are supported. Authenticated decryption protects your privacy.
		</p>
	</div>
)

const FileListItem = ({ file, status, onRemove }: FileListItemProps) => (
	<div className="flex items-center gap-3 bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-800 hover:border-slate-700 transition-all duration-200">
		<File className="w-4 h-4 text-emerald-400 flex-shrink-0" />
		<span className="truncate flex-1 text-slate-200 text-sm font-medium text-left">
			{file.name}
		</span>
		<span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full flex-shrink-0">
			{formatFileSize(file.size)} MB
		</span>

		{status && (
			<div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
				{DecryptStatusHelper.getStatusIcon(status)}
				<span className={`text-xs font-semibold ${DecryptStatusHelper.getStatusColor(status)}`}>
					{DecryptStatusHelper.getStatusText(status)}
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
			disabled={status === 'decrypting' || status === 'verifying'}
		>
			<X className="w-4 h-4" />
		</button>
	</div>
)

const ModeToggle = ({ useKey, onToggle }: { useKey: boolean, onToggle: (useKey: boolean) => void }) => (
	<div className="mb-6">
		<div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900/80 rounded-xl border border-slate-800">
			<button
				onClick={() => onToggle(false)}
				className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
					!useKey 
						? "bg-slate-800 text-white shadow-sm" 
						: "text-slate-400 hover:text-slate-200"
				}`}
			>
				<KeyRound className="w-4 h-4 flex-shrink-0" />
				<span>Password</span>
			</button>

			<button
				onClick={() => onToggle(true)}
				className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
					useKey 
						? "bg-slate-800 text-white shadow-sm" 
						: "text-slate-400 hover:text-slate-200"
				}`}
			>
				<Key className="w-4 h-4 flex-shrink-0" />
				<span><span className="hidden sm:inline">Encryption </span>Key</span>
			</button>
		</div>
	</div>
)

const PasswordInput = ({ password, onChange }: PasswordInputProps) => (
	<div className="mb-6 text-left">
		<div className="relative">
			<KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
			<input
				type="password"
				placeholder="Enter your password"
				value={password}
				onChange={(e) => onChange(e.target.value)}
				className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all duration-200"
			/>
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
		<div className="mb-6 text-left">
			<div className="relative">
				<Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
				<input
					type="text"
					placeholder="Enter encryption key (Base64 or human-readable format)"
					value={encryptionKey}
					onChange={(e) => onChange(e.target.value)}
					className={`w-full bg-slate-950 border rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:outline-none transition-all duration-200 ${
						validationState.startsWith('valid') 
							? 'border-emerald-500/35 focus:ring-emerald-500 focus:border-emerald-500' 
							: validationState.startsWith('invalid') 
								? 'border-red-500/35 focus:ring-red-500 focus:border-red-500' 
								: 'border-slate-850 focus:ring-emerald-500 focus:border-emerald-500'
					}`}
				/>
			</div>

			<div className="mt-2.5 pl-1 flex items-start gap-2">
				<div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
					validationState.startsWith('valid') 
						? 'bg-emerald-500' 
						: validationState.startsWith('invalid') 
							? 'bg-red-500' 
							: 'bg-slate-600'
				}`} />
				<div className="flex-1">
					<p className="text-xs text-slate-500 leading-relaxed">
						{validationState === 'empty' && (
							'Paste the Base64 encryption key or human-readable format (e.g., DRAGON-MANGO-FOREST-12345).'
						)}
						{validationState === 'valid-human' && (
							<span className="text-emerald-400">✓ Valid human-readable key format! Ready to decrypt.</span>
						)}
						{validationState === 'invalid-human' && (
							<span className="text-red-400">⚠️ Invalid human-readable format. Ensure it follows WORD-WORD-WORD-NNNNN.</span>
						)}
						{validationState === 'valid-base64' && (
							<span className="text-emerald-400">✓ Valid Base64 key format! Ready to decrypt.</span>
						)}
						{validationState === 'invalid-base64' && (
							<span className="text-red-400">⚠️ Invalid Base64 character format. Please check your key.</span>
						)}
						{validationState === 'invalid-size' && (
							<span className="text-red-400">⚠️ Invalid key size. Expected 32 bytes.</span>
						)}
					</p>
				</div>
			</div>
		</div>
	)
}

const DecryptButton = ({ isDisabled, isProcessing, fileCount, hasPassword, onClick }: DecryptButtonProps) => (
	<Button
		onClick={onClick}
		disabled={isDisabled}
		variant="ghost"
		className="w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm border-0 bg-emerald-600 hover:bg-emerald-700 text-white"
	>
		{isProcessing ? (
			<>
				<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
				<span>{hasPassword ? "Verifying..." : "Decrypting..."}</span>
			</>
		) : (
			<>
				<Unlock className="w-4 h-4" />
				<span>{fileCount >= 1 ? "Decrypt & Download All" : "Decrypt & Download"}</span>
			</>
		)}
	</Button>
)

export function DecryptForm() {
	const [files, setFiles] = useState<File[]>([])
	const [password, setPassword] = useState("")
	const [encryptionKey, setEncryptionKey] = useState("")
	const [useKey, setUseKey] = useState(false)
	const [status, setStatus] = useState<DecryptFileStatus>({})
	const [isProcessing, setIsProcessing] = useState(false)
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

	const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
		setToast({ message, type })
		setTimeout(() => setToast(null), duration)
	}, [])

	const hasFiles = useMemo(() => files.length > 0, [files.length])
	const hasPassword = useMemo(() => password.length > 0, [password.length])
	const hasKey = useMemo(() => encryptionKey.length > 0, [encryptionKey.length])
	const hasCredentials = useMemo(() => useKey ? hasKey : hasPassword, [useKey, hasKey, hasPassword])
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

			if (xhr.status === 400) {
				if (errorText.includes('Invalid encryption key format')) {
					return '⚠️ Invalid encryption key format.'
				}
				if (errorText.includes('Invalid encryption key size')) {
					return '⚠️ Invalid encryption key size.'
				}
				if (errorText.includes('Password must be at least')) {
					return '⚠️ Password must be at least 8 characters.'
				}
				if (errorText.includes('Password cannot be empty')) {
					return '⚠️ Password cannot be empty.'
				}
				return errorText || 'Invalid request.'
			}

			if (xhr.status === 401) {
				return '❌ Wrong password/key or file corrupt.'
			}

			return getErrorMessage(xhr.status, errorText)
		} catch {
			return getErrorMessage(xhr.status)
		}
	}, [])

	const decryptSingleFile = useCallback((file: File): Promise<void> => {
		return new Promise((resolve, reject) => {
			let actualKey = encryptionKey

			if (useKey && hasKey) {
				if (isHumanReadableFormat(encryptionKey)) {
					const base64Key = getBase64FromHuman(encryptionKey)
					if (base64Key) {
						actualKey = base64Key
						showToast('🎉 Human key converted successfully!', 'success')
					} else {
						reject(new Error('⚠️ Invalid human key format.'))
						return
					}
				} else {
					if (!isValidBase64(encryptionKey)) {
						const errorMsg = '⚠️ Invalid Base64 key format.'
						showToast(errorMsg, 'error')
						reject(new Error(errorMsg))
						return
					}

					try {
						const decoded = atob(encryptionKey)
						if (decoded.length !== 32) {
							const errorMsg = `⚠️ Invalid key size (expected 32 bytes).`
							showToast(errorMsg, 'error')
							reject(new Error(errorMsg))
							return
						}
					} catch (e) {
						const errorMsg = '⚠️ Invalid Base64 format.'
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

			if (useKey && hasKey) {
				xhr.setRequestHeader("x-enc-key", actualKey)
			} else if (hasPassword) {
				xhr.setRequestHeader("x-password", password)
			}

			xhr.responseType = "blob"

			xhr.onload = () => {
				if (xhr.status === 200) {
					downloadFile(xhr.response, xhr)
					showToast('✅ Decrypted successfully!', 'success')
					resolve()
				} else {
					handleDecryptError(xhr)
						.then((errorMessage) => {
							showToast(errorMessage, 'error', 5000)
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
				const errorMsg = "Network error."
				showToast(errorMsg, 'error')
				reject(new Error(errorMsg))
			}

			file.arrayBuffer()
				.then((buffer) => {
					xhr.send(buffer)
				})
				.catch(() => {
					const errorMsg = "Failed to read file."
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
		<div className="card-form-subtle p-5 sm:p-6 max-w-xl mx-auto my-4 text-center relative">
			<HeroIcon />
			<TitleSection />

			{/* File Upload Area */}
			<div
				{...getRootProps()}
				className={`relative upload-area-subtle p-5 sm:p-6 cursor-pointer mb-6 rounded-xl border border-slate-800 ${
					isDragActive ? "ring-2 ring-emerald-500 border-emerald-500 bg-slate-900/60" : ""
				}`}
				style={{ minHeight: 140 }}
			>
				<input {...getInputProps()} />

				<div className="mb-4">
					<Upload className={`w-8 h-8 text-emerald-400 mx-auto mb-3 transition-colors ${
						isDragActive ? "text-emerald-300" : ""
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
								{isDragActive ? "Drop your .xd files here" : "Drag & drop your .xd files"}
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
				<div className={`mt-4 p-3 rounded-xl ${
					getBase64FromHuman(encryptionKey)
						? 'bg-emerald-950/20 border border-emerald-900/50'
						: 'bg-red-950/20 border border-red-900/50'
				}`}>
					<p className={`text-xs ${
						getBase64FromHuman(encryptionKey) ? 'text-emerald-400' : 'text-red-400'
					}`}>
						{getBase64FromHuman(encryptionKey) ? (
							<>🎉 <strong>Perfect!</strong> This human-readable key is ready for decryption.</>
						) : (
							<>⚠️ <strong>Invalid key!</strong> Human-readable keys must match WORD-WORD-WORD-NNNNN format.</>
						)}
					</p>
				</div>
			)}

			{/* Soft Toast Notification */}
			{toast && (
				<div className={`fixed top-4 right-4 z-50 text-white px-5 py-3 rounded-lg shadow-lg border border-slate-800 transition-all duration-300 ${
					toast.type === 'success' ? 'bg-emerald-900/90' :
					toast.type === 'error' ? 'bg-red-950/90' :
					'bg-slate-900/90'
				}`}>
					<span className="text-xs font-semibold">{toast.message}</span>
				</div>
			)}
		</div>
	)
}
