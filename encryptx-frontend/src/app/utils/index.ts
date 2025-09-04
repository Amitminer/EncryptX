import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import packageJson from "../../../package.json";

/** Combines class names and resolves Tailwind CSS conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns current application version from package.json */
export function getVersion() {
  return packageJson.version;
}

/** Formats file size in bytes to human-readable KB/MB string */
export const formatFileSize = (bytes: number): string => {
  if (bytes <= 0 || isNaN(bytes)) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

/** GitHub repository URL */
export const GitHubUrl = "https://github.com/Amitminer/EncryptX";

/** Returns current year as number */
export function getCurrentYear() {
  return new Date().getFullYear()
}
