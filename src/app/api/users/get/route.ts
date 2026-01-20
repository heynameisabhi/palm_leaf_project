import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search')?.toLowerCase() || '';

        const whereClause: Prisma.UserAccountWhereInput = {
            OR: [
                { user_name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
                { user_id: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
            ]
        };

        // Fetch users with search filter if search query is provided
        const users = await db.userAccount.findMany({
            where: searchQuery ? whereClause : undefined,
            select: {
                user_id: true,
                user_name: true,
                email: true,
                role: true,
                phone_no: true,
                address: true,
                status: true
            }
        });

        if (!users.length) {
            return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(users, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
}