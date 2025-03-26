import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getAuthSession();

        if(!session) {
            return NextResponse.json("Unauthorized", { status: 401 });
        }

        const users = await db.userAccount.findMany()

        if(!users) {
            return NextResponse.json("No users found", { status: 404 });
        }

        console.log(users);
        return NextResponse.json(users, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
}