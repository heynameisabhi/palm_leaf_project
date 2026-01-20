import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET a single Grantha by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { granthaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const granthaId = params.granthaId;

    const grantha = await db.grantha.findUnique({
      where: { grantha_id: granthaId },
      include: {
        granthaDeck: {
          select: {
            grantha_deck_id: true,
            grantha_deck_name: true,
            user: {
              select: {
                user_name: true,
              },
            },
          },
        },
        language: true,
        author: true,
        scannedImages: {
          include: {
            scanningProperties: true,
          },
        },
      },
    });

    if (!grantha) {
      return NextResponse.json(
        { error: "Grantha not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to edit
    const canEdit = session.user.role === "admin" || 
                   grantha.granthaDeck.user.user_name === session.user.name;

    return NextResponse.json({ grantha, canEdit });
  } catch (error) {
    console.error("Error fetching grantha:", error);
    return NextResponse.json(
      { error: "Failed to fetch grantha" },
      { status: 500 }
    );
  }
}

// UPDATE a Grantha
export async function PUT(
  request: NextRequest,
  { params }: { params: { granthaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const granthaId = params.granthaId;
    const data = await request.json();

    // First check if the grantha exists and user has permission
    const existingGrantha = await db.grantha.findUnique({
      where: { grantha_id: granthaId },
      include: {
        granthaDeck: {
          select: {
            user: {
              select: {
                user_name: true,
              },
            },
          },
        },
      },
    });

    if (!existingGrantha) {
      return NextResponse.json(
        { error: "Grantha not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to edit
    const canEdit = session.user.role === "admin" || 
                   existingGrantha.granthaDeck.user.user_name === session.user.name;

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this Grantha" },
        { status: 403 }
      );
    }

    // Update the grantha
    const updatedGrantha = await db.grantha.update({
      where: { grantha_id: granthaId },
      data: {
        grantha_name: data.grantha_name,
        description: data.description,
        remarks: data.remarks,
        language: {
          update: {
            language_name: data.language_name,
          },
        },
        author: {
          update: {
            author_name: data.author_name,
            birth_year: data.birth_year,
            death_year: data.death_year,
            bio: data.bio,
            scribe_name: data.scribe_name,
          },
        },
      },
      include: {
        granthaDeck: {
          select: {
            grantha_deck_id: true,
            grantha_deck_name: true,
          },
        },
        language: true,
        author: true,
      },
    });

    return NextResponse.json({ 
      message: "Grantha updated successfully", 
      grantha: updatedGrantha 
    });
  } catch (error) {
    console.error("Error updating grantha:", error);
    return NextResponse.json(
      { error: "Failed to update grantha" },
      { status: 500 }
    );
  }
} 