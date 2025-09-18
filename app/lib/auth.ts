import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Validate required user data
          if (!user.email) {
            console.error("Google sign-in failed: No email provided");
            return false;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // User exists, check if Google account is already linked
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
            });

            if (!existingAccount) {
              // Link Google account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  id_token: account.id_token,
                  refresh_token: account.refresh_token,
                  scope: account.scope,
                  session_state: account.session_state,
                  token_type: account.token_type,
                },
              });
              console.log(`Google account linked to existing user: ${user.email}`);
            }
          } else {
            // New user - will be created automatically by NextAuth
            console.log(`New user signing up with Google: ${user.email}`);
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          // Return specific error messages based on error type
          if (error instanceof Error) {
            if (error.message.includes("Unique constraint")) {
              console.error("Account already linked");
            } else if (error.message.includes("Foreign key constraint")) {
              console.error("User creation failed");
            }
          }
          return false;
        }
      }
      return true;
    },
    session: ({ session, token, user }) => {
      if (session?.user) {
        if (token?.sub) {
          session.user.id = token.sub;
        } else if (user?.id) {
          session.user.id = user.id;
        }
      }
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};
