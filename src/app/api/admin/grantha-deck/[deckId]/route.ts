import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// GET: Retrieve a specific Grantha Deck by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = params.deckId;
    if (!deckId) {
      return NextResponse.json(
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    // Fetch the Grantha Deck with additional data
    const granthaDeck = await db.granthaDeck.findUnique({
      where: {
        grantha_deck_id: deckId,
      },
      include: {
        _count: {
          select: { granthas: true },
        },
        user: {
          select: {
            user_id: true,
            user_name: true,
            email: true,
          },
        },
        granthas: {
          select: {
            grantha_id: true,
            grantha_name: true,
            _count: {
              select: { scannedImages: true },
            },
          },
        },
      },
    });

    if (!granthaDeck) {
      return NextResponse.json(
        { error: "Grantha Deck not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(granthaDeck);
  } catch (error) {
    console.error("Error fetching Grantha Deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch Grantha Deck" },
      { status: 500 }
    );
  }
}

// PATCH: Update a specific Grantha Deck
export async function PATCH(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deckId = params.deckId;
    if (!deckId) {
      return NextResponse.json(
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this deck
    const existingDeck = await db.granthaDeck.findUnique({
      where: {
        grantha_deck_id: deckId,
      },
      select: {
        user_id: true,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "Grantha Deck not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the owner
    if (existingDeck.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this deck" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Update the Grantha Deck
    const updatedDeck = await db.granthaDeck.update({
      where: {
        grantha_deck_id: deckId,
      },
      data: {
        grantha_deck_name: data.grantha_deck_name,
        grantha_owner_name: data.grantha_owner_name,
        grantha_source_address: data.grantha_source_address,
        length_in_cms: data.length_in_cms,
        width_in_cms: data.width_in_cms,
        total_leaves: data.total_leaves,
        total_images: data.total_images,
        stitch_or_nonstitch: data.stitch_or_nonstitch,
        physical_condition: data.physical_condition,
      },
    });

    return NextResponse.json({
      message: "Grantha Deck updated successfully",
      deck: updatedDeck,
    });
  } catch (error) {
    console.error("Error updating Grantha Deck:", error);
    return NextResponse.json(
      { error: "Failed to update Grantha Deck" },
      { status: 500 }
    );
  }
}
