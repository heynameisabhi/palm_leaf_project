import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { author_name, birth_year, death_year, bio, scribe_name } = reqBody;

        if(!author_name) {
            return NextResponse.json("Author name is required", { status: 400 });
        }

        if(!scribe_name) {
            return NextResponse.json("Scribe Name is required", { status: 400 });
        }

        await db.author.create({
            data: {
                author_name: author_name,
                birth_year: birth_year,
                death_year: death_year,
                bio: bio,
                scribe_name: scribe_name,
            },
        })

        return NextResponse.json(`Grantha Author ${author_name} created successfully.`, { status: 200 });


    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
}