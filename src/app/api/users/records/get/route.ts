import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {

        const session = await getAuthSession();
        if(!session) {
            return NextResponse.json("Unauthorized", { status: 401 });
        }

        const firstFiveGranthaDeckRecords = await db.granthaDeck.findMany({
            where: {
                user_id: session.user.id
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        })

        const recordCount = await db.granthaDeck.count({
            where: {
                user_id: session.user.id
            }
        })


        return NextResponse.json({ firstFiveGranthaDeckRecords, recordCount, message: "Records fetched successfully" }, { status: 200 });
        
    } catch (error: any) {

        console.log(error.message);
        return NextResponse.json(error.message, { status: 500 });
        
    }
}