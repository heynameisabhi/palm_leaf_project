import { z } from "zod";

export const UserAccountValidator = z.object({
    userId: z.string(),
    userName: z.string(),
    password: z.string().min(8, "Your password must contain atleast 8 characters!"),
    role: z.string(),
    phoneNo: z.string().optional(),
    email: z.string(),
    address: z.string().optional(),
})

export type UserAccount = z.infer<typeof UserAccountValidator>