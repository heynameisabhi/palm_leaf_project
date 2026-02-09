import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
 context: { params: Promise<{ granthaDeckId: string }> }
) {
  try {
    // ✅ await params
    const { granthaDeckId } = await context.params;

    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const granthaDeck = await db.granthaDeck.findUnique({
      where: {
        grantha_deck_id: granthaDeckId,
      },
      include: {
        _count: {
          select: { granthas: true },
        },
        granthas: {
          include: {
            language: true,
            author: true,
            scannedImages: {
              select: {
                image_id: true,
                image_name: true,
                image_url: true,
              },
            //   take: 1, // Just get one image for preview
            },
          }
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

    if (!granthaDeck) {
      return NextResponse.json(
        { error: "Grantha deck not found" },
        { status: 404 }
      );
    }

    // all should have permission to view 
    
    // if (granthaDeck.user_id !== session.user.id) {
    //   return NextResponse.json(
    //     { error: "You don't have permission to view this deck" },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json({ granthaDeck });
  } catch (error) {
    console.error("Error fetching grantha deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch grantha deck" },
      { status: 500 }
    );
  }
} 