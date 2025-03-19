import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LoginUserAccountValidator } from "@/lib/validators/useraccount";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { username, email, password } = LoginUserAccountValidator.parse(reqBody);

        const user = await db.userAccount.findFirst({
            where: {
                OR: [
                    { user_name: username },
                    { email },
                ]
            }
        })

        if(!user) {
            return NextResponse.json({
                success: false,
                message: "User does not exist. Please register first."    
            }, { status: 400 })
        }
        
        if(user.status === UserStatus.BLOCKED) {
            return NextResponse.json({
                success: false,
                message: "User is blocked. Please contact admin."
            }, { status: 403 })
        }

        if(user.status === UserStatus.SUSPENDED) {
            return NextResponse.json({
                success: false,
                message: "User is suspended. Please contact admin."
            }, { status: 403 })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect) {
            return NextResponse.json({
                success: false,
                message: "Invalid user credentials. Please try again."    
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: "User logged in successfully.",
            data: user
        }, { status: 200 })
        
    } catch (error) {
        if(error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid request data passed: ", error }, {status: 422})
        }

        return NextResponse.json({ message: "Could not login user, please try again later." }, {status: 500})
    }
}