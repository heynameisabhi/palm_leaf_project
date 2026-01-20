import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { grantha_name, description, remarks, author_id, language_id } = body

    // Validate required fields
    if (!grantha_name || !author_id || !language_id) {
      return NextResponse.json(
        { error: "Missing required fields: grantha_name, author_id, language_id" },
        { status: 400 }
      )
    }

    // Check if grantha exists
    const existingGrantha = await prisma.grantha.findUnique({
      where: { grantha_id: id }
    })

    if (!existingGrantha) {
      return NextResponse.json(
        { error: "Grantha not found" },
        { status: 404 }
      )
    }

    // Verify author and language exist
    const [author, language] = await Promise.all([
      prisma.author.findUnique({ where: { author_id } }),
      prisma.language.findUnique({ where: { language_id } })
    ])

    if (!author) {
      return NextResponse.json(
        { error: "Author not found" },
        { status: 400 }
      )
    }

    if (!language) {
      return NextResponse.json(
        { error: "Language not found" },
        { status: 400 }
      )
    }

    // Update grantha
    const updatedGrantha = await prisma.grantha.update({
      where: { grantha_id: id },
      data: {
        grantha_name,
        description: description || null,
        remarks: remarks || null,
        author_id,
        language_id
      },
      include: {
        author: true,
        language: true,
        granthaDeck: true
      }
    })

    return NextResponse.json({
      message: "Grantha updated successfully",
      grantha: updatedGrantha
    })

  } catch (error) {
    console.error("Error updating grantha:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
