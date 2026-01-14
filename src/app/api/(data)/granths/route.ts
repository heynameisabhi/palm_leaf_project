import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { grantha_name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { author_name: { contains: search, mode: 'insensitive' } } },
        { language: { language_name: { contains: search, mode: 'insensitive' } } },
        { granthaDeck: { grantha_deck_name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const granths = await db.grantha.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            author_id: true,
            author_name: true,
            birth_year: true,
            death_year: true
          }
        },
        language: {
          select: {
            language_id: true,
            language_name: true
          }
        },
        granthaDeck: {
          select: {
            grantha_deck_id: true,
            grantha_deck_name: true,
            grantha_owner_name: true
          }
        },
        _count: {
          select: {
            scannedImages: true
          }
        }
      },
      orderBy: { grantha_name: 'asc' },
      take: limit,
      skip: offset
    });

    const totalCount = await db.grantha.count({
      where: whereClause
    });

    return NextResponse.json({ 
      granths, 
      totalCount,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error("Error fetching granths:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}