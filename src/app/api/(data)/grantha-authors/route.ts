import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { authorName, birthYear, deathYear, bio, scribeName } = reqBody;

        if(!authorName) {
            return NextResponse.json("Author name is required", { status: 400 });
        }

        if(!scribeName) {
            return NextResponse.json("Scribe Name is required", { status: 400 });
        }

        await db.author.create({
            data: {
                author_name: authorName,
                birth_year: birthYear,
                death_year: deathYear,
                bio: bio,
                scribe_name: scribeName
            },
        })

        return NextResponse.json(`Grantha Author ${authorName} created successfully.`, { status: 200 });


    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
}