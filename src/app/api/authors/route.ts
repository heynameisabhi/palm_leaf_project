import { db } from "@/lib/db"
import { NextResponse } from "next/server"


export async function GET() {
  try {
    const authors = await db.author.findMany({
      orderBy: { author_name: 'asc' }
    })

    return NextResponse.json({ authors })
  } catch (error) {
    console.error("Error fetching authors:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}