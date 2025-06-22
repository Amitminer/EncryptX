import { NextResponse } from "next/server"

export async function GET() {
  const monitorId = process.env.BETTER_MONITOR_ID
  const apiKey = process.env.BETTER_API_KEY

  if (!monitorId || !apiKey) {
    return NextResponse.json({ status: "unknown" }, { status: 500 })
  }

  const res = await fetch(`https://betteruptime.com/api/v2/monitors/${monitorId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    return NextResponse.json({ status: "unknown" }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ status: data.data.attributes.status }) // "up" / "down"
}
