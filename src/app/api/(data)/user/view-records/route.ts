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
    const userId = searchParams.get("userId") || session.user.id;
    const username = searchParams.get("username") || "";
    const deckName = searchParams.get("deckName") || "";
    const limitParam = searchParams.get("limit");
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Set default limit to 10 if not specified
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Build the where clause based on filters
    const whereClause: any = {};
    
    // If a specific user ID is provided, filter by it
    if (userId) {
      whereClause.user_id = userId;
    }
    
    // If a deck name is provided, filter with case-insensitive search
    if (deckName) {
      whereClause.grantha_deck_name = {
        contains: deckName,
        mode: 'insensitive',
      };
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

    // If username filter is applied, find users matching the username
    if (username) {
      const users = await db.userAccount.findMany({
        where: {
          user_name: {
            contains: username,
            mode: 'insensitive',
          },
        },
        select: { user_id: true },
      });
      
      const userIds = users.map(user => user.user_id);
      
      // Only apply user_id filter if we found matching users
      if (userIds.length > 0) {
        whereClause.user_id = { in: userIds };
      } else {
        // If no users match the username, return empty result
        return NextResponse.json({ granthaDeckRecords: [] });
      }
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