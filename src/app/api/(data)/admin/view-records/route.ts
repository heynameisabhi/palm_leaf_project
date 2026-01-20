import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const userId = searchParams.get("userId");
    const username = searchParams.get("username");
    const limitParam = searchParams.get("limit");

    const limit = limitParam ? parseInt(limitParam) : 10;

    const queryOptions: any = {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            user_name: true,
            email: true,
          },
        },
        _count: {
          select: { granthas: true },
        },
      },
    };

    // Build where clause
    const whereClause: any = {};

    if (userId) {
      whereClause.user_id = userId;
    }

    if (username) {
      whereClause.user = {
        user_name: {
          contains: username,
          mode: 'insensitive',
        },
      };
    }

    // If user is not admin, only show their records unless they explicitly search
    if (session.user.role !== "ADMIN" && !userId && !username) {
      whereClause.user_id = session.user.id;
    }

    if (Object.keys(whereClause).length > 0) {
      queryOptions.where = whereClause;
    }

    if (limit) {
      queryOptions.take = limit;
    }

    const granthaDeckRecords = await db.granthaDeck.findMany(queryOptions);

    return NextResponse.json(
      { granthaDeckRecords, message: "Records fetched successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json(error.message, { status: 500 });
  }
}
