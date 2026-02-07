import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// ======================
// ✅ GET SINGLE AUTHOR
// ======================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {

    const author = await db.author.findUnique({
      where: { author_id: params.id }
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
  { params }: { params: { id: string } }
) {
  try {

    const body = await req.json()

    const updatedAuthor = await db.author.update({
      where: { author_id: params.id },
      data: body
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
  { params }: { params: { id: string } }
) {
  try {

    await db.author.delete({
      where: { author_id: params.id }
    })

    return NextResponse.json({ message: "Author deleted successfully" })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
