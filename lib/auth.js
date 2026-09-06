import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './db';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

/**
 * Reusable server-side session helper for Pages Router API routes & server context.
 */
export async function getAuthSession(req, res) {
  return await auth(req, res);
}

/**
 * Reusable API route protection logic.
 */
export async function requireAuth(req, res) {
  const session = await getAuthSession(req, res);
  if (!session || !session.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return null;
  }
  return session;
}
