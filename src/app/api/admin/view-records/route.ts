import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const deckName = searchParams.get("deckName") || undefined;
        const deckId = searchParams.get("deckId") || undefined;
        const limit = parseInt(searchParams.get("limit") || "10");
        const startDate = searchParams.get("startDate") || undefined;
        const endDate = searchParams.get("endDate") || undefined;

        // Build the where clause dynamically
        const whereClause: any = {};

        // Filter by deck name
        if (deckName) {
            whereClause.grantha_deck_name = {
                contains: deckName,
                mode: "insensitive",
            };
        }

        // Filter by deck ID
        if (deckId) {
            whereClause.grantha_deck_id = {
                contains: deckId,
                mode: "insensitive",
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

        // Fetch Grantha Deck records with filters
        const granthaDeckRecords = await db.granthaDeck.findMany({
            where: whereClause,
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
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        // Get total count for the filters
        const totalCount = await db.granthaDeck.count({
            where: whereClause,
        });

        return NextResponse.json({
            granthaDeckRecords,
            totalCount,
            filters: {
                deckName,
                deckId,
                limit,
                startDate,
                endDate,
            },
        });
    } catch (error) {
        console.error("Error fetching Grantha Deck records:", error);
        return NextResponse.json(
            { error: "Failed to fetch records" },
            { status: 500 }
        );
    }
}
