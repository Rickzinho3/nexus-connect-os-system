import type { NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    tenantId?: string | null;
  }
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in, populate token from user
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;

