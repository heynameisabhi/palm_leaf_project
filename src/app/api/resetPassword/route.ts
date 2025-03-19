import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";


export async function PUT(request: NextRequest) {
    try {
        const reqBody = await request.json();
    
        const { token, newPassword } = reqBody;
    
        if(!token) {
            return NextResponse.json({error: "Token not found!"}, {status: 400});
        }
    
        console.log("Token: ", token);

        const user = await db.userAccount.findFirst({
            where: {
                forgotPasswordToken: token,
                forgotPasswordTokenExpiry: {
                    gt: new Date(),
                }
            }
        })
    
        if(!user) {
            return NextResponse.json({error: "Invalid token"}, {status: 400});
        }
    
        // change or reset the password
        if(!newPassword) {
            return NextResponse.json({error: "Password not found!"}, {status: 400});
        }
    
        
        // hash the new password
        const salt = await bcryptjs.genSalt(10) 
        const hashedPassword = await bcryptjs.hash(newPassword, salt);
    
        await db.userAccount.update({
            where: {
                user_id: user.user_id,
            },
            data: {
                password: hashedPassword,
                forgotPasswordToken: null,
                forgotPasswordTokenExpiry: null,
            },
        });
    
        return NextResponse.json({
            message: "Password changed successfully!", 
            userData: user,
            success: true
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
}