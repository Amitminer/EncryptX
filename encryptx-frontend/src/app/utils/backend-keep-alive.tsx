"use client"

import { useEffect } from "react"

const PING_INTERVAL_MS = 14 * 60 * 1000 // 14 minutes, to be safe for platforms with 15-min timeouts

export function BackendKeepAlive() {
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const response = await fetch(`${backendUrl}/health`);
        if (response.ok) {
          console.log("Backend keep-alive: Ping successful.")
        } else {
          console.error(`Backend keep-alive: Ping failed with status ${response.status}.`)
        }
      } catch (error) {
        console.error("Backend keep-alive: Error pinging backend.", error)
      }
    }

    pingBackend()

    const interval = setInterval(pingBackend, PING_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return null
} 