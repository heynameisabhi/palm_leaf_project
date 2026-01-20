import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/helpers/mailer";


export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { email } = reqBody;

        if (!email) {
            return NextResponse.json({ error: "Email not found!" }, { status: 400 });
        }

        const user = await db.userAccount.findFirst({
            where: {
                email
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found!" }, { status: 402 });
        }

        // send the forgotpasswordemail if the user with email exists
        await sendEmail({
            email,
            userId: user.user_id,
        });
            
        return NextResponse.json(
            {
                message: "User exists and forgot password Email sent successfully!",
                success: true,
                user,
            }, 
            {
                status: 200
            }
        );

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}