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
  if (bytes <= 0 || isNaN(bytes)) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

export const GitHubUrl = "https://github.com/Amitminer/EncryptX";

export function getCurrentYear() {
  return new Date().getFullYear()
}
