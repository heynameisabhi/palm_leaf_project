import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Create an update object with only the provided fields
    const updateData: any = {};

    // Only add fields to updateData if they are provided in the request
    if (body.grantha_deck_name !== undefined) {
      updateData.grantha_deck_name = body.grantha_deck_name;
    }
    if (body.grantha_owner_name !== undefined) {
      updateData.grantha_owner_name = body.grantha_owner_name;
    }
    if (body.grantha_source_address !== undefined) {
      updateData.grantha_source_address = body.grantha_source_address;
    }
    if (body.length_in_cms !== undefined) {
      updateData.length_in_cms = body.length_in_cms
        ? parseFloat(body.length_in_cms)
        : null;
    }
    if (body.width_in_cms !== undefined) {
      updateData.width_in_cms = body.width_in_cms
        ? parseFloat(body.width_in_cms)
        : null;
    }
    if (body.total_leaves !== undefined) {
      updateData.total_leaves = body.total_leaves
        ? parseInt(body.total_leaves)
        : null;
    }
    if (body.total_images !== undefined) {
      updateData.total_images = body.total_images
        ? parseInt(body.total_images)
        : null;
    }
    if (body.stitch_or_nonstitch !== undefined) {
      updateData.stitch_or_nonstitch = body.stitch_or_nonstitch;
    }
    if (body.physical_condition !== undefined) {
      updateData.physical_condition = body.physical_condition;
    }

    // First check if the deck exists and belongs to the user
    const existingDeck = await db.granthaDeck.findUnique({
      where: {
        grantha_deck_id: params.id,
      },
      select: {
        user_id: true,
      },
    });

    if (!existingDeck) {
      return NextResponse.json(
        { error: "Grantha deck not found" },
        { status: 404 }
      );
    }

    if (existingDeck.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this deck" },
        { status: 403 }
      );
    }

    // Update the deck with only the provided fields
    const updatedDeck = await db.granthaDeck.update({
      where: {
        grantha_deck_id: params.id,
      },
      data: updateData,
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
      },
    });

    return NextResponse.json({ granthaDeck: updatedDeck });
  } catch (error) {
    console.error("Error updating grantha deck:", error);
    return NextResponse.json(
      { error: "Failed to update grantha deck" },
      { status: 500 }
    );
  }
}
