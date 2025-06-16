import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const languages = await db.language.findMany({
      orderBy: { language_name: 'asc' }
    })

    return NextResponse.json({ languages })
  } catch (error) {
    console.error("Error fetching languages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}