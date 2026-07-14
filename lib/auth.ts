import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "vocab_dektriam_super_secret_key_2026_tcas_tgat",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        email: { label: "อีเมล", type: "email", placeholder: "student@dektriam.com" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        const creds = credentials as Record<string, string | undefined> | undefined;
        const identifier = (creds?.username || creds?.email || "") as string;
        if (!identifier || !creds?.password) {
          throw new Error("กรุณากรอกชื่อผู้ใช้หรือรหัสผ่านให้ครบถ้วน");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { name: identifier.trim() },
              { email: identifier.trim() },
            ],
          },
        });

        if (!user || !user.password) {
          throw new Error("ไม่พบข้อมูลบัญชีผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง");
        }

        const isPasswordValid = await bcrypt.compare(
          creds?.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
