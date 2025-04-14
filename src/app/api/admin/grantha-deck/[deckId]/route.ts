import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // const { searchParams } = request.nextUrl;
    
    const deckId = params.deckId;
    const granthaDeck = await db.granthaDeck.findUnique({
      where: { grantha_deck_id: deckId },
      include: {
        user: {
          select: {
            user_name: true,
          },
        },
        granthas: {
          include: {
            language: true,
            author: true,
          },
        },
        _count: {
          select: { granthas: true },
        },
      },
    });

    if (!granthaDeck) {
      return NextResponse.json(
        { error: "Grantha Deck not found" },
        { status: 404 }
      );
    }

    
    return NextResponse.json({ granthaDeck });
  } catch (error) {
    console.error("Error fetching Grantha Deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch Grantha Deck" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = params.deckId;
    const data = await request.json();

    // Check if the deck exists and if the user has permission
    const existingDeck = await db.granthaDeck.findUnique({
      where: { grantha_deck_id: deckId },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: "Grantha Deck not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && existingDeck.user_id !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to edit this deck" }, { status: 403 });
    }

    // Update the deck
    const updatedDeck = await db.granthaDeck.update({
      where: { grantha_deck_id: deckId },
      data: {
        grantha_deck_name: data.grantha_deck_name,
        grantha_owner_name: data.grantha_owner_name,
        grantha_source_address: data.grantha_source_address,
        length_in_cms: data.length_in_cms ? parseFloat(data.length_in_cms) : null,
        width_in_cms: data.width_in_cms ? parseFloat(data.width_in_cms) : null,
        total_leaves: data.total_leaves ? parseInt(data.total_leaves) : null,
        total_images: data.total_images ? parseInt(data.total_images) : null,
        stitch_or_nonstitch: data.stitch_or_nonstitch,
        physical_condition: data.physical_condition,
      },
    });

    return NextResponse.json({ 
      message: "Grantha Deck updated successfully",
      granthaDeck: updatedDeck 
    });
  } catch (error) {
    console.error("Error updating Grantha Deck:", error);
    return NextResponse.json(
      { error: "Failed to update Grantha Deck" },
      { status: 500 }
    );
  }
}
