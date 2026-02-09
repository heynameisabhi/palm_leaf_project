import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// ======================
// ✅ GET SINGLE AUTHOR
// ======================
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const author = await db.author.findUnique({
      where: { author_id: id },
    })

    if (!author) {
      return NextResponse.json(
        { error: "Author not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(author)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ======================
// ✅ UPDATE AUTHOR
// ======================
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const updatedAuthor = await db.author.update({
      where: { author_id: id },
      data: body,
    })

    return NextResponse.json(updatedAuthor)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ======================
// ✅ DELETE AUTHOR
// ======================
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    await db.author.delete({
      where: { author_id: id },
    })

    return NextResponse.json({
      message: "Author deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
