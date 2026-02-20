import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import pool from '@/src/libs/db';
import { createHash } from 'crypto';
import {DBAdminUser} from "@/src/interfaces/db"
import {NextAuthSessionInput, NextAuthJWTInput} from "@/src/interfaces/custom-next-auth"

export const md5 = (str: string): string => {
  return createHash('md5').update(str).digest('hex');
};

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
        // The name to display on the sign in form (e.g. 'Sign in with...')
        name: 'Credentials',
        // The credentials is used to generate a suitable form on the sign in page.
        // You can specify whatever fields you are expecting to be submitted.
        // e.g. domain, username, password, 2FA token, etc.
        // You can pass any HTML attribute to the <input> tag through the object.
        credentials: {
            username: { label: "Username", type: "text", placeholder: "jsmith" },
            password: { label: "Password", type: "password" }
        },

        async authorize(credentials: Record<string, string> | undefined, req): Promise<DBAdminUser | null> {
            // You need to provide your own logic here that takes the credentials
            // submitted and returns either a object representing a user or value
            // that is false/null if the credentials are invalid.
            // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
            // You can also use the `req` object to obtain additional parameters
            // (i.e., the request IP address)
            // const res = await fetch("/your/endpoint", {
            //     method: 'POST',
            //     body: JSON.stringify(credentials),
            //     headers: { "Content-Type": "application/json" }
            // })
            // const user = await res.json()

            // // If no error and we have user data, return it
            // if (res.ok && user) {
            //     return user
            // }
            console.log("auth credentials", credentials)
            if(credentials !== undefined && "username" in credentials && "password" in credentials) {
              try {
                const [rows] = await pool.query<DBAdminUser[]>({
                  sql: 'SELECT id, name, email, username, password, is_super, status FROM administrator WHERE username=?',
                  values: [credentials?.username]
                });
                if (rows.length === 1) {
                  const user: DBAdminUser = rows[0];
                  if (user.status === 1) {
                    if(md5(credentials?.password) === user.password) {
                      return user
                    } else {
                      console.error("Incorrect password: ", credentials)
                      throw new Error("Incorrect credentials.");
                    }
                  } else {
                    console.error("User status - blocked: ", credentials)
                    throw new Error("The user is blocked because they are not a direct member of a group with access, nor had access directly assigned by an administrator.");
                  }
                } else {
                  if (rows.length === 0) {
                    console.error("User not found by username: ", credentials)
                    throw new Error("User not found.");
                  } else {
                    console.error("To many users found by credentials: ", credentials)
                    throw new Error("Incorrect username spelling, or system synchronization issues.");
                  }
                }
              } catch (error) {
                console.error("Failed to fetch SQL select user credentials: ", error)
                throw new Error("We're sorry, something went wrong on our end. Please try reloading the page in a minute(1).");
              }
            } else {
              console.error("Credentials incorrect: ", credentials)
              throw new Error("Authentication failed! Please, check credentials and try again.");
            }
        },
    })
    // ...add more providers here
  ],

  callbacks: {
    async jwt({ token, user, account, profile }: NextAuthJWTInput) {
      if (user) {
        // 'user' is only present on the first sign-in
        token.id = user.id;
        token.role = user.role; // Add custom field from your user model
        token.is_super = user.is_super; 
      }
      return token;
    },

    async session({ session, token }: NextAuthSessionInput) {
      if (token) {
        // Explicitly forward properties from the token to the session object
        session.user.id = token.id;
        session.user.role = token.is_super ? "admin" : "lowyer";
        session.user.is_super = token.is_super
      }
      return session;
    },
  }
}

// export default NextAuth(authOptions)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }