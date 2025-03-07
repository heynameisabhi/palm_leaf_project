import { z } from "zod";

export const RegisterUserAccountValidator = z.object({
    username: z.string(),
    password: z.string()
        .min(8, "Your password must contain at least 8 characters!")
        .regex(/[A-Z]/, "Your password must contain at least one uppercase letter!")
        .regex(/[a-z]/, "Your password must contain at least one lowercase letter!")
        .regex(/[0-9]/, "Your password must contain at least one number!")
        .regex(/[\W_]/, "Your password must contain at least one special character!"),
    role: z.string(),
    phoneNo: z.string().optional(),
    email: z.string(),
    address: z.string().optional(),
})

export type RegisterUserAccount = z.infer<typeof RegisterUserAccountValidator>

export const LoginUserAccountValidator = z.object({
    username: z.string(),
    email: z.string(),
    password: z.string()
        .min(8, "Your password must contain at least 8 characters!")
        .regex(/[A-Z]/, "Your password must contain at least one uppercase letter!")
        .regex(/[a-z]/, "Your password must contain at least one lowercase letter!")
        .regex(/[0-9]/, "Your password must contain at least one number!")
        .regex(/[\W_]/, "Your password must contain at least one special character!"),
})

export type LoginUserAccount = z.infer<typeof LoginUserAccountValidator>