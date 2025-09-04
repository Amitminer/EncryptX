/** PDF generation utilities for encryption key backups with styling */

import { convertToHumanReadable } from './crypto'

// Re-export for convenience
export { convertToHumanReadable }

/** Options for PDF generation */
export interface PDFGenerationOptions {
	generatedKeys: { [fileName: string]: string }
	companyName?: string
	companyLogo?: string
	includeInstructions?: boolean
	customInstructions?: string[]
}

/** Color palette for PDF styling */
const colors = {
	primary: [88, 28, 135] as [number, number, number],      // Purple-800 (darker)
	primaryLight: [139, 92, 246] as [number, number, number], // Purple-500
	accent: [168, 85, 247] as [number, number, number],      // Purple-400
	background: [249, 250, 251] as [number, number, number], // Gray-50
	cardBg: [255, 255, 255] as [number, number, number],     // White
	text: [31, 41, 55] as [number, number, number],          // Gray-800 (darker)
	textMedium: [75, 85, 99] as [number, number, number],    // Gray-600
	border: [209, 213, 219] as [number, number, number],     // Gray-300
	success: [21, 128, 61] as [number, number, number],      // Green-700
	successBg: [240, 253, 244] as [number, number, number],  // Green-50
	warning: [180, 83, 9] as [number, number, number],       // Orange-700
	warningBg: [255, 251, 235] as [number, number, number],  // Amber-50
}

/** Draws circular EncryptX logo */
const drawEncryptXLogo = (doc: import('jspdf').jsPDF, x: number, y: number, radius: number = 8) => {
	// Draw circle background
	doc.setFillColor(255, 255, 255) // White circle
	doc.circle(x, y, radius, 'F')
	
	// Draw circle border
	doc.setDrawColor(200, 200, 200) // Light gray border
	doc.setLineWidth(0.5)
	doc.circle(x, y, radius, 'S')
	
	// Add EncryptX text
	doc.setTextColor(...colors.primary)
	doc.setFontSize(radius * 0.8) // Scale font with circle size
	doc.setFont('helvetica', 'bold')
	
	// Center the text in the circle
	const text = 'EncryptX'
	const textWidth = doc.getTextWidth(text)
	doc.text(text, x - textWidth / 2, y + radius * 0.2)
}

/** Draws card with shadow effect */
const drawCard = (doc: import('jspdf').jsPDF, x: number, y: number, width: number, height: number) => {
	// Shadow
	doc.setFillColor(200, 200, 200)
	doc.rect(x + 1, y + 1, width, height, 'F')

	// Card background
	doc.setFillColor(...colors.cardBg)
	doc.rect(x, y, width, height, 'F')

	// Border
	doc.setDrawColor(...colors.border)
	doc.setLineWidth(0.5)
	doc.rect(x, y, width, height, 'S')
}

/** Generates PDF backup of encryption keys */
export const generateKeysPDF = async (options: PDFGenerationOptions): Promise<void> => {
	const {
		generatedKeys,
		companyName = 'EncryptX',
		includeInstructions = true
	} = options

	try {
		// Dynamic import to avoid SSR issues
		const { jsPDF } = await import('jspdf')
		const doc = new jsPDF()

		// === HEADER SECTION ===
		// Header background
		doc.setFillColor(...colors.primary)
		doc.rect(0, 0, 210, 35, 'F')

		// EncryptX logo
		drawEncryptXLogo(doc, 25, 18, 10)

		// Company name
		doc.setTextColor(255, 255, 255)
		doc.setFontSize(22)
		doc.setFont('helvetica', 'bold')
		doc.text(companyName, 40, 18)

		// Subtitle
		doc.setFontSize(11)
		doc.setFont('helvetica', 'normal')
		doc.text('Secure Encryption Key Backup', 40, 26)

		// Metadata box - Solid white background for visibility
		doc.setFillColor(255, 255, 255) // Solid white, no alpha
		doc.rect(130, 8, 75, 20, 'F')
		doc.setDrawColor(200, 200, 200) // Light gray border
		doc.setLineWidth(0.5)
		doc.rect(130, 8, 75, 20, 'S')

		doc.setTextColor(31, 41, 55) // Dark text for better contrast
		doc.setFontSize(9)
		doc.setFont('helvetica', 'bold')
		const now = new Date()
		doc.text(`Generated: ${now.toLocaleDateString()}`, 135, 15)
		doc.text(`Time: ${now.toLocaleTimeString()}`, 135, 20)
		doc.text(`Files: ${Object.keys(generatedKeys).length}`, 135, 25)

		// === MAIN TITLE ===
		let yPos = 55
		doc.setTextColor(...colors.text)
		doc.setFontSize(18)
		doc.setFont('helvetica', 'bold')
		doc.text('Encryption Key Backup', 20, yPos)

		// Description
		yPos += 15
		doc.setFontSize(11)
		doc.setFont('helvetica', 'normal')
		doc.setTextColor(...colors.textMedium)
		doc.text('Your files have been encrypted with auto-generated secure keys.', 20, yPos)
		doc.text('Store this document securely - these keys cannot be recovered if lost!', 20, yPos + 7)

		// === SECURITY WARNING ===
		yPos += 25
		drawCard(doc, 15, yPos, 180, 30)

		// Warning header
		doc.setFillColor(...colors.warningBg)
		doc.rect(15, yPos, 180, 10, 'F')

		doc.setTextColor(...colors.warning)
		doc.setFontSize(10)
		doc.setFont('helvetica', 'bold')
		doc.text('CRITICAL - SECURITY NOTICE', 25, yPos + 7)

		// Warning content
		doc.setTextColor(...colors.text)
		doc.setFontSize(10)
		doc.setFont('helvetica', 'normal')
		doc.text('• Store this document in a secure, encrypted location', 25, yPos + 17)
		doc.text('• These keys cannot be recovered if lost - backup immediately', 25, yPos + 24)

		// === ENCRYPTION KEYS SECTION ===
		yPos += 45
		doc.setTextColor(...colors.text)
		doc.setFontSize(16)
		doc.setFont('helvetica', 'bold')
		doc.text('Encryption Keys', 20, yPos)

		// Keys counter
		doc.setFillColor(...colors.successBg)
		doc.rect(130, yPos - 5, 50, 10, 'F')
		doc.setTextColor(...colors.success)
		doc.setFontSize(9)
		doc.setFont('helvetica', 'bold')
		doc.text(`${Object.keys(generatedKeys).length} Files Encrypted`, 135, yPos)

		yPos += 20

		Object.entries(generatedKeys).forEach(([fileName, key], index) => {
			// Key card - Increased height to accommodate larger Base64 section
			const cardHeight = 60
			drawCard(doc, 15, yPos, 180, cardHeight)

			// File header
			doc.setFillColor(...colors.primaryLight)
			doc.rect(15, yPos, 180, 12, 'F')

			doc.setTextColor(255, 255, 255)
			doc.setFontSize(11)
			doc.setFont('helvetica', 'bold')
			doc.text(`FILE: ${fileName}`, 25, yPos + 8)

			// File number badge
			doc.setFillColor(255, 255, 255)
			doc.circle(175, yPos + 6, 4, 'F')
			doc.setTextColor(...colors.primary)
			doc.setFontSize(9)
			doc.setFont('helvetica', 'bold')
			doc.text(`${index + 1}`, 173.5, yPos + 8)

			// Human-readable key
			const keyY = yPos + 20
			doc.setTextColor(...colors.textMedium)
			doc.setFontSize(9)
			doc.setFont('helvetica', 'bold')
			doc.text('HUMAN-READABLE KEY (Recommended)', 25, keyY)

			// Key background
			doc.setFillColor(248, 250, 252)
			doc.rect(25, keyY + 3, 160, 10, 'F')
			doc.setDrawColor(...colors.primaryLight)
			doc.setLineWidth(1)
			doc.rect(25, keyY + 3, 160, 10, 'S')

			// The actual key - BIG and BOLD
			const humanKey = convertToHumanReadable(key)
			doc.setTextColor(...colors.primary)
			doc.setFontSize(13)
			doc.setFont('helvetica', 'bold')
			doc.text(humanKey, 30, keyY + 10)

			// Base64 key - More prominent now
			doc.setTextColor(...colors.text)
			doc.setFontSize(10)
			doc.setFont('helvetica', 'bold')
			doc.text('BASE64 ALTERNATIVE:', 25, keyY + 20)

			// Base64 background
			doc.setFillColor(245, 245, 245)
			doc.rect(25, keyY + 23, 160, 15, 'F')
			doc.setDrawColor(...colors.border)
			doc.setLineWidth(0.5)
			doc.rect(25, keyY + 23, 160, 15, 'S')

			doc.setTextColor(...colors.text)
			doc.setFontSize(8)
			doc.setFont('courier', 'bold')
			const keyLines = doc.splitTextToSize(key, 150)
			doc.text(keyLines, 30, keyY + 29)

			yPos += cardHeight + 10

			// Page break if needed
			if (yPos > 240 && index < Object.keys(generatedKeys).length - 1) {
				doc.addPage()
				yPos = 30

				// Mini header
				doc.setFillColor(...colors.primary)
				doc.rect(0, 0, 210, 20, 'F')
				drawEncryptXLogo(doc, 15, 10, 8)
				doc.setTextColor(255, 255, 255)
				doc.setFontSize(14)
				doc.setFont('helvetica', 'bold')
				doc.text(`${companyName} - Key Backup (Continued)`, 30, 13)
			}
		})

		// === FOOTER ===
		const addFooter = (pageNum: number, totalPages: number) => {
			doc.setFillColor(...colors.background)
			doc.rect(0, 280, 210, 17, 'F')

			doc.setTextColor(...colors.textMedium)
			doc.setFontSize(8)
			doc.setFont('helvetica', 'normal')
			doc.text(`© ${new Date().getFullYear()} ${companyName} - Confidential Document`, 20, 290)
			doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 294)

			doc.setTextColor(...colors.primary)
			doc.setFont('helvetica', 'bold')
			doc.text(`Page ${pageNum} of ${totalPages}`, 170, 292)
		}

		// === INSTRUCTIONS PAGE ===
		if (includeInstructions) {
			doc.addPage()

			// Header
			doc.setFillColor(...colors.primary)
			doc.rect(0, 0, 210, 25, 'F')
			drawEncryptXLogo(doc, 20, 12, 10)

			doc.setTextColor(255, 255, 255)
			doc.setFontSize(16)
			doc.setFont('helvetica', 'bold')
			doc.text('Decryption Instructions', 35, 16)

			let instructionY = 40

			// Quick start
			drawCard(doc, 15, instructionY, 180, 25)
			doc.setFillColor(...colors.successBg)
			doc.rect(15, instructionY, 180, 8, 'F')

			doc.setTextColor(...colors.success)
			doc.setFontSize(10)
			doc.setFont('helvetica', 'bold')
			doc.text('QUICK START GUIDE', 25, instructionY + 6)

			doc.setTextColor(...colors.text)
			doc.setFontSize(10)
			doc.setFont('helvetica', 'normal')
			doc.text('1. Go to EncryptX Decrypt page', 25, instructionY + 15)
			doc.text('2. Upload your .xd file and paste the human-readable key above', 25, instructionY + 21)

			instructionY += 35

			// Detailed sections
			const sections = [
				{
					title: 'What You Need',
					items: [
						'Your encrypted .xd file(s)',
						'The encryption key from this document',
						'Access to EncryptX platform (web or CLI)'
					]
				},
				{
					title: 'Web Interface Steps',
					items: [
						'Visit the EncryptX Decrypt page',
						'Toggle to "Encryption Key" mode',
						'Upload your .xd file',
						'Paste the human-readable key (easier) or Base64 key',
						'Click "Decrypt & Download"'
					]
				},
				{
					title: 'Command Line Usage',
					items: [
						'Run: encryptx decrypt --file yourfile.xd --key YOUR_KEY',
						'Use either key format in the --key parameter',
						'Decrypted file saves to current directory'
					]
				},
				{
					title: 'Key Format Info',
					items: [
						'Human-readable: 3 words + 5 digits (e.g., DRAGON-MANGO-FOREST-12345)',
						'Much easier to type than Base64 format',
						'Both formats work identically for decryption',
						'Use whichever format is more convenient'
					]
				},
				{
					title: 'Security Best Practices',
					items: [
						'Store this document in a password manager',
						'Create backups in multiple secure locations',
						'Never share keys via email or unsecured channels',
						'Delete temporary copies after use'
					]
				}
			]

			sections.forEach(section => {
				if (instructionY > 250) {
					doc.addPage()
					instructionY = 30
				}

				// Section title
				doc.setTextColor(...colors.primary)
				doc.setFontSize(12)
				doc.setFont('helvetica', 'bold')
				doc.text(section.title, 20, instructionY)

				instructionY += 10

				// Section items
				section.items.forEach(item => {
					if (instructionY > 270) {
						doc.addPage()
						instructionY = 30
					}

					doc.setTextColor(...colors.text)
					doc.setFontSize(10)
					doc.setFont('helvetica', 'normal')
					doc.text(`• ${item}`, 25, instructionY)
					instructionY += 6
				})

				instructionY += 8
			})
		}

		// Apply footers to all pages
		const pageCount = doc.getNumberOfPages()
		for (let i = 1; i <= pageCount; i++) {
			doc.setPage(i)
			addFooter(i, pageCount)
		}

		// Save with timestamp
		const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
		doc.save(`${companyName}-Keys-${timestamp}.pdf`)

	} catch (error) {
		console.error('Error generating PDF:', error)
		throw new Error('Failed to generate PDF backup')
	}
}

/** Generates simple custom PDF with title and content */
export const generateCustomPDF = async (
	title: string,
	content: string[],
	filename?: string
): Promise<void> => {
	try {
		const { jsPDF } = await import('jspdf')
		const doc = new jsPDF()

		// Header
		doc.setFillColor(...colors.primary)
		doc.rect(0, 0, 210, 25, 'F')
		drawEncryptXLogo(doc, 20, 12, 10)

		doc.setTextColor(255, 255, 255)
		doc.setFontSize(16)
		doc.setFont('helvetica', 'bold')
		doc.text(title, 35, 16)

		// Content
		let yPosition = 45
		doc.setTextColor(...colors.text)
		doc.setFontSize(11)
		doc.setFont('helvetica', 'normal')

		content.forEach(line => {
			if (yPosition > 270) {
				doc.addPage()
				yPosition = 30
			}
			doc.text(line, 20, yPosition)
			yPosition += 8
		})

		// Footer
		const pageCount = doc.getNumberOfPages()
		for (let i = 1; i <= pageCount; i++) {
			doc.setPage(i)
			doc.setFillColor(...colors.background)
			doc.rect(0, 280, 210, 17, 'F')
			doc.setTextColor(...colors.textMedium)
			doc.setFontSize(8)
			doc.text('Generated by EncryptX', 20, 290)
			doc.setTextColor(...colors.primary)
			doc.text(`Page ${i} of ${pageCount}`, 170, 290)
		}

		const defaultFilename = filename || `${title.replace(/\s+/g, '-')}-${Date.now()}.pdf`
		doc.save(defaultFilename)

	} catch (error) {
		console.error('Error generating PDF:', error)
		throw new Error('Failed to generate PDF')
	}
}
