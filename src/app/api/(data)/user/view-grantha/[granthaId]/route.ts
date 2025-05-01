import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { granthaId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const granthaId = params.granthaId;

    const grantha = await db.grantha.findUnique({
      where: { grantha_id: granthaId },
      include: {
        granthaDeck: {
          select: {
            grantha_deck_id: true,
            grantha_deck_name: true,
            user_id: true,
            user: {
              select: {
                user_id: true,
                user_name: true,
              },
            },
          },
        },
        language: true,
        author: true,
        scannedImages: {
          select: {
            image_id: true,
            image_name: true,
            image_url: true,
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
    const canEdit = session.user.id === grantha.granthaDeck.user_id;

    return NextResponse.json({ grantha, canEdit });
  } catch (error) {
    console.error("Error fetching grantha:", error);
    return NextResponse.json(
      { error: "Failed to fetch grantha" },
      { status: 500 }
    );
  }
} 