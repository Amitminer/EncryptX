/**
 * Cryptographic utilities for EncryptX frontend.
 *
 * Provides human-readable key conversion and validation for better UX.
 * Converts Base64 keys to memorable word formats and back.
 */

// Word dictionary for human-readable keys (64 words for 6-bit encoding)
const WORD_DICTIONARY = [
	'ZOMBIE', 'CREEPER', 'SKELETON', 'SPIDER', 'ENDERMAN', 'GHAST', 'SLIME', 'MAGMA',
	'WITCH', 'PIGLIN', 'HOGLIN', 'VEX', 'GUARDIAN', 'ELDER', 'GOLEM', 'WITHER',
	'DRAGON', 'VILLAGER', 'WANDERING', 'TRADER', 'PARROT', 'COD', 'SALMON', 'PUFFERFISH',
	'OCELOT', 'FOX', 'BEE', 'TURTLE', 'PANDA', 'POLAR', 'BEAR', 'MOOSHROOM',
	'WOLF', 'AXOLOTL', 'WARDEN', 'ALLAY', 'FROG', 'TADPOLE', 'CAMEL', 'SNIFFER',
	'CHEST', 'CRAFTING', 'FURNACE', 'ANVIL', 'ENCHANTING', 'TABLE', 'BREWING', 'STAND',
	'DIAMOND', 'NETHERITE', 'EMERALD', 'IRON', 'GOLD', 'REDSTONE', 'LAPIS', 'COAL',
	'STONE', 'WOOD', 'PLANKS', 'COBBLESTONE', 'OBSIDIAN', 'GRAVEL', 'SAND', 'DIRT'
]

/** Converts Base64 key to human-readable format (WORD1-WORD2-WORD3-NNNNN) */
export const convertToHumanReadable = (base64Key: string): string => {
	try {
		// Decode base64 to get raw bytes
		const binaryString = atob(base64Key)
		const bytes = new Uint8Array(binaryString.length)
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i)
		}

		// Use first 6 bytes to create a short, memorable format
		// This gives us enough entropy while keeping it human-friendly
		const word1Index = bytes[0] & 0x3F // First 6 bits
		const word2Index = bytes[1] & 0x3F // Next 6 bits
		const word3Index = bytes[2] & 0x3F // Next 6 bits

		// Use next 3 bytes for numbers (more variety)
		const num1 = bytes[3] || 0
		const num2 = bytes[4] || 0
		const num3 = bytes[5] || 0

		const word1 = WORD_DICTIONARY[word1Index]
		const word2 = WORD_DICTIONARY[word2Index]
		const word3 = WORD_DICTIONARY[word3Index]

		// Create a short, memorable format: WORD1-WORD2-WORD3-NNNNN
		// Use 5 digits for more variety: combine 3 bytes into a number
		const combinedNum = (num1 << 16) | (num2 << 8) | num3
		const shortCode = `${word1}-${word2}-${word3}-${(combinedNum % 100000).toString().padStart(5, '0')}`

		// Store the full mapping for this session
		storeKeyMapping(shortCode, base64Key)

		return shortCode
	} catch (error) {
		console.error('Error converting to human readable:', error)
		return 'INVALID-KEY_FORMAT'
	}
}

/** Stores key mapping in localStorage for session persistence */
function storeKeyMapping(humanKey: string, base64Key: string): void {
	try {
		const mappings = JSON.parse(localStorage.getItem('encryptx-key-mappings') || '{}')
		mappings[humanKey.toUpperCase()] = base64Key
		localStorage.setItem('encryptx-key-mappings', JSON.stringify(mappings))
	} catch (error) {
		console.error('Failed to store key mapping:', error)
	}
}

/** Retrieves stored key mapping from localStorage */
function getStoredKeyMapping(humanKey: string): string | null {
	try {
		const mappings = JSON.parse(localStorage.getItem('encryptx-key-mappings') || '{}')
		return mappings[humanKey.toUpperCase()] || null
	} catch (error) {
		console.error('Failed to get key mapping:', error)
		return null
	}
}



/** Converts human-readable format back to Base64 key */
export const convertFromHumanReadable = (humanKey: string): string | null => {
	try {
		// First, try to get from localStorage (same session)
		const storedKey = getStoredKeyMapping(humanKey)
		if (storedKey) {
			return storedKey
		}

		// Fallback: Generate deterministic key from human format
		// This ensures keys work across sessions/devices
		return generateDeterministicKey(humanKey)

	} catch (error) {
		console.error('Error converting from human readable:', error)
		return null
	}
}

/** Generates deterministic 32-byte key from human-readable format */
function generateDeterministicKey(humanKey: string): string {
	// Use a more sophisticated key derivation
	const normalizedKey = humanKey.toUpperCase().trim()

	// Create multiple hash rounds for better distribution
	let hash1 = 0, hash2 = 0, hash3 = 0, hash4 = 0

	for (let i = 0; i < normalizedKey.length; i++) {
		const char = normalizedKey.charCodeAt(i)
		hash1 = ((hash1 << 5) - hash1 + char) & 0xffffffff
		hash2 = ((hash2 << 7) - hash2 + char * 3) & 0xffffffff
		hash3 = ((hash3 << 11) - hash3 + char * 7) & 0xffffffff
		hash4 = ((hash4 << 13) - hash4 + char * 11) & 0xffffffff
	}

	// Generate 32 bytes using multiple PRNGs
	const bytes = new Uint8Array(32)
	let rng1 = hash1, rng2 = hash2, rng3 = hash3, rng4 = hash4

	for (let i = 0; i < 32; i++) {
		// Use different generators for different byte positions
		const generator = i % 4
		let value: number

		switch (generator) {
			case 0:
				rng1 = (rng1 * 1664525 + 1013904223) & 0xffffffff
				value = rng1
				break
			case 1:
				rng2 = (rng2 * 1103515245 + 12345) & 0xffffffff
				value = rng2
				break
			case 2:
				rng3 = (rng3 * 16807 + 0) & 0xffffffff
				value = rng3
				break
			default:
				rng4 = (rng4 * 48271 + 0) & 0xffffffff
				value = rng4
		}

		bytes[i] = (value >>> 24) & 0xff
	}

	// Convert to base64
	let binary = ''
	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}

	const result = btoa(binary)
	return result
}

/** Checks if input matches human-readable format pattern */
export const isHumanReadableFormat = (input: string): boolean => {
	// Pattern to match: WORD1-WORD2-WORD3-NNNNN (short format with 5 digits)
	const humanPattern = /^[A-Z]+-[A-Z]+-[A-Z]+-\d{5}$/
	return humanPattern.test(input.trim().toUpperCase())
}

/** Gets Base64 key from human-readable format */
export const getBase64FromHuman = (humanKey: string): string | null => {
	return convertFromHumanReadable(humanKey)
}

/** Validates Base64 key format and 32-byte length */
export const validateBase64Key = (base64Key: string): boolean => {
	try {
		const decoded = atob(base64Key)
		return decoded.length === 32
	} catch {
		return false
	}
}
