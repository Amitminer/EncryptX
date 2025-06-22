import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import packageJson from "../../../package.json";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVersion() {
  return packageJson.version;
}

export const formatFileSize = (bytes: number): string => {
  return (bytes / 1024 / 1024).toFixed(2)
}

export const GitHubUrl = "https://github.com/Amitminer/EncryptX";

export function getCurrentYear() {
  return new Date().getFullYear()
}
