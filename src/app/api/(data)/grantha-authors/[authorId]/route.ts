// app/api/grantha-authors/[authorId]/route.ts

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET single author
export async function GET(
  request: NextRequest,
  { params }: { params: { authorId: string } }
) {
  try {
    const { authorId } = params;

    if (!authorId) {
      return NextResponse.json("Author ID is required", { status: 400 });
    }

    const author = await db.author.findUnique({
      where: {
        author_id: authorId,
      },
      include: {
        _count: {
          select: { granthas: true }
        }
      }
    });

    if (!author) {
      return NextResponse.json("Author not found", { status: 404 });
    }

    return NextResponse.json(author, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}

// UPDATE author
export async function PUT(
  request: NextRequest,
  { params }: { params: { authorId: string } }
) {
  try {
    const { authorId } = params;
    const reqBody = await request.json();
    const { author_name, birth_year, death_year, bio, scribe_name } = reqBody;

    if (!authorId) {
      return NextResponse.json("Author ID is required", { status: 400 });
    }

    if (!author_name) {
      return NextResponse.json("Author name is required", { status: 400 });
    }

    if (!scribe_name) {
      return NextResponse.json("Scribe name is required", { status: 400 });
    }

    // Check if author exists
    const existingAuthor = await db.author.findUnique({
      where: { author_id: authorId },
    });

    if (!existingAuthor) {
      return NextResponse.json("Author not found", { status: 404 });
    }

    // Update author
    const updatedAuthor = await db.author.update({
      where: {
        author_id: authorId,
      },
      data: {
        author_name,
        birth_year,
        death_year,
        bio,
        scribe_name,
      },
    });

    return NextResponse.json(
      { 
        message: `Author ${author_name} updated successfully.`,
        author: updatedAuthor 
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}

// DELETE author
export async function DELETE(
  request: NextRequest,
  { params }: { params: { authorId: string } }
) {
  try {
    const { authorId } = params;

    if (!authorId) {
      return NextResponse.json("Author ID is required", { status: 400 });
    }

    // Check if author exists
    const existingAuthor = await db.author.findUnique({
      where: { author_id: authorId },
      include: {
        _count: {
          select: { granthas: true }
        }
      }
    });

    if (!existingAuthor) {
      return NextResponse.json("Author not found", { status: 404 });
    }

    // Check if author has associated granths
    if (existingAuthor._count.granthas > 0) {
      return NextResponse.json(
        `Cannot delete author. This author has ${existingAuthor._count.granthas} associated granth(s). Please remove or reassign them first.`,
        { status: 400 }
      );
    }

    // Delete author
    await db.author.delete({
      where: {
        author_id: authorId,
      },
    });

    return NextResponse.json(
      { message: `Author ${existingAuthor.author_name} deleted successfully.` },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}