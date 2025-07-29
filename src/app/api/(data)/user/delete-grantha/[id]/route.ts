import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Grantha ID is required" },
        { status: 400 }
      );
    }

    // First, find the grantha and check if it exists
    const existingGrantha = await db.grantha.findUnique({
      where: {
        grantha_id: id,
      },
      include: {
        granthaDeck: {
          select: {
            user_id: true,
            grantha_deck_name: true,
          },
        },
        scannedImages: {
          select: {
            image_id: true,
          },
        },
        _count: {
          select: {
            scannedImages: true,
          },
        },
      },
    });

    console.log("Existing Grantha:", existingGrantha);

    if (!existingGrantha) {
      return NextResponse.json({ error: "Grantha not found" }, { status: 404 });
    }

    // Check if the user owns the grantha deck that contains this grantha
    if (existingGrantha.granthaDeck.user_id !== session.user.id) {
      return NextResponse.json(
        {
          error: "Forbidden: You can only delete granthas from your own decks",
        },
        { status: 403 }
      );
    }

    // Delete the grantha, all the associated scanned images and properties will be deleted as you delete grantha because of cascade
    await db.grantha.delete({
      where: {
        grantha_id: id,
      },
    });

    return NextResponse.json(
      {
        message: "Grantha deleted successfully",
        deletedGrantha: {
          id: existingGrantha.grantha_id,
          name: existingGrantha.grantha_name,
          deckName: existingGrantha.granthaDeck.grantha_deck_name,
          deletedImagesCount: existingGrantha._count.scannedImages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting grantha:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
