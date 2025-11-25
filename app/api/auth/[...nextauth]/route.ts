import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan Password wajib diisi");
        }

        // 1. Cari user berdasarkan USERNAME
        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user) {
          throw new Error("Username tidak ditemukan");
        }

        // 2. Cek Password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // 3. Login sukses -> Kembalikan data user
        return {
          id: user.id,
          name: user.fullName,
          email: user.username, // Kita pinjam field email untuk simpan username
          role: user.role, 
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.username = user.email; 
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.name = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // Redirect ke sini kalau belum login
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "rahasia_dapur_adida_123", 
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };