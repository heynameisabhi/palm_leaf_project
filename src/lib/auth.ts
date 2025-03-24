import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // pages: {
  //   signIn: "/login", // Redirect to login page if not authenticated
  // },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.email) {
          throw new Error("Email,Username and password are required.");
        }

        console.log(credentials)

        const user = await db.userAccount.findFirst({
          where: {
            OR: [
              { email: credentials.email },
              { user_name: credentials.username },
            ],
          },
        });

        console.log(user)

        if (!user) {
          throw new Error("User does not exist. Please register first.");
        }

        if (user.status === UserStatus.BLOCKED) {
          throw new Error("User is blocked. Contact admin.");
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new Error("User is suspended. Contact admin.");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials. Please try again.");
        }

        return {
          id: user.user_id,
          name: user.user_name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getAuthSession = async () => await getServerSession(authOptions);
