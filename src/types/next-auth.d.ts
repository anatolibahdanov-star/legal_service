// next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the built-in session and user types
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique ID */
      id: string; // The default user in the adapter has an id, but the session user does not by default
      /** Custom field for user role */
      role: 'admin' | 'lowyer' | 'user';
      is_super: boolean;
      // Add other custom fields here
    } & DefaultSession["user"];
  }

  /**
   * Returned by the authorize function and saved to the DB
   */
  interface User extends DefaultUser {
    /** Custom field for user role */
    role: 'admin' | 'lowyer' | 'user';
    id: string;
    is_super?: boolean;
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback */
  interface JWT {
    /** Custom field for user role */
    role: 'admin' | 'lowyer' | 'user';
    id: string;
    is_super: boolean;
    // Add other custom fields here
  }
}
