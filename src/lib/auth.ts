import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
        if (!credentials?.username && !credentials?.email) {
          throw new Error("Email or username is required.");
        }
        
        if (!credentials?.password) {
          throw new Error("Password is required.");
        }

        console.log("Credentials:", credentials);

        const user = await db.userAccount.findFirst({
          where: {
            OR: [
              { email: credentials.email || "" },
              { user_name: credentials.username || "" },
            ],
          },
        });

        console.log("User found:", user);

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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }

      // Update token if session is updated
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const getAuthSession = async () => {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error("Error getting auth session:", error);
    return null;
  }
};