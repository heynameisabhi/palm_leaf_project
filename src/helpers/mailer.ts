import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

interface sendEmailProps {
    email: string;
    userId: string;
}


export const sendEmail = async ({email, userId}: sendEmailProps) => {
    try {
        // create a hashed token
        const hashedToken = await bcryptjs.hash(userId.toString(), 10);
        
        await db.userAccount.update({
            where: {
                user_id: userId,
            },
            data: {
                forgotPasswordToken: hashedToken,
                forgotPasswordTokenExpiry: new Date(Date.now() + 3600000),
            }
        })

        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_HOST, 
            port: Number(process.env.NODEMAILER_PORT),
            auth: {
                user: process.env.NODEMAILER_AUTH_USER,
                pass: process.env.NODEMAILER_AUTH_PASS,
            }
        });

        const mailOptions = {
            from: "test@gmail.com",
            to: email,
            subject: "Reset your password",
            html:`<p>Click <a href="${process.env.DOMAIN}/resetPassword?token=${hashedToken}">here</a> to reset your password
            or copy and paste the link below in your browser.<br> ${process.env.DOMAIN}/resetPassword?token=${hashedToken}
            </p>`,
        }

        const mailResponse = await transporter.sendMail(mailOptions);
        
        return mailResponse;

    } catch (error: any) {
        throw new Error(error.message);
    }
}