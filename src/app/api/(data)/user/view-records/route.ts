import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const deckName = searchParams.get("deckName") || "";
    const deckId = searchParams.get("deckId") || "";
    const limitParam = searchParams.get("limit");
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Set default limit to 10 if not specified
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Build the where clause based on filters
    const whereClause: any = {};

    // If a deck name is provided, filter with case-insensitive search
    if (deckName) {
      whereClause.grantha_deck_name = {
        contains: deckName,
        mode: 'insensitive',
      };
    }

    // If a deck ID is provided, filter by it
    if (deckId) {
      whereClause.grantha_deck_id = {
        contains: deckId,
        mode: 'insensitive',
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};

      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        // Set to end of day for the end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // Build the include clause for related data
    const includeClause = {
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
    };

    // Build the orderBy clause based on sort parameters
    const orderByClause: any = {};

    // Handle special cases for sorting fields
    if (sortField === "user_name") {
      orderByClause.user = { user_name: sortOrder };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    // Query the database
    const granthaDeckRecords = await db.granthaDeck.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: orderByClause,
      take: limit,
    });

    return NextResponse.json({ granthaDeckRecords });
  } catch (error) {
    console.error("Error fetching grantha deck records:", error);
    return NextResponse.json(
      { error: "Failed to fetch grantha deck records" },
      { status: 500 }
    );
  }
} 