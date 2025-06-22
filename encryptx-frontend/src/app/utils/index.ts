import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import packageJson from "../../../package.json";

/**
 * Combines multiple class name values into a single string, resolving Tailwind CSS class conflicts.
 *
 * Accepts any number of class name inputs, merges them using `clsx`, and then applies `tailwind-merge` to ensure only the correct Tailwind classes remain.
 *
 * @returns The merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current application version as specified in the package.json file.
 *
 * @returns The version string of the application
 */
export function getVersion() {
  return packageJson.version;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes <= 0 || isNaN(bytes)) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

export const GitHubUrl = "https://github.com/Amitminer/EncryptX";

/**
 * Returns the current year as a number.
 */
export function getCurrentYear() {
  return new Date().getFullYear()
}
