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
    const limitParam = searchParams.get("limit");

    const limit = limitParam ? parseInt(limitParam) : 10;

    const queryOptions: any = {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { granthas: true },
        },
      },
    };

    if (userId) {
      // if the userId is passed in the request filter the records based on the userId
      queryOptions.where = {
        user_id: userId,
      };
    }

    if (limit) {
      // if the limit is passed in the request limit the records to the specified limit
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
