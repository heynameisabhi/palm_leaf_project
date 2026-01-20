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
        { error: "Deck ID is required" },
        { status: 400 }
      );
    }

    const existingDeck = await db.granthaDeck.findUnique({
      where: {
        grantha_deck_id: id,
      },
      include: {
        _count: {
          select: { granthas: true },
        },
      },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existingDeck.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own decks" },
        { status: 403 }
      );
    }

    await db.grantha.deleteMany({
      where: {
        grantha_deck_id: id,
      },
    });

    await db.granthaDeck.delete({
      where: {
        grantha_deck_id: id,
      },
    });

    return NextResponse.json(
      {
        message: "Deck deleted successfully",
        deletedDeck: {
          id: existingDeck.grantha_deck_id,
          name: existingDeck.grantha_deck_name,
          granthasCount: existingDeck._count.granthas,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
