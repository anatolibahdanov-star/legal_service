import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import {getAdministratorByEmail} from "@/src/repositories/administrators/repo"
import {login} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"
import {NextAuthSessionInput, NextAuthJWTInput} from "@/src/interfaces/custom-next-auth"

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

        async authorize(credentials: Record<string, string> | undefined, req): Promise<DBUser | null> {
            console.log("auth credentials", credentials)
            if(credentials !== undefined && "username" in credentials && "password" in credentials) {
              try {
                const admin: DBUser | null | undefined = await getAdministratorByEmail(credentials?.username, credentials?.password)
                let user: DBUser | null = null
                if(!admin) {
                  const _user: DBUser | null | undefined = await login(credentials?.username, credentials?.password)
                  if(_user){
                    user = _user
                  }
                } else {
                  user = admin
                }
                if (user) {
                  if (user.status && user.status !== 1) {
                    console.error("User status - blocked: ", credentials)
                    throw new Error("Данный Юрист был заблокирован. Обратитесь к администратору.");
                  } else if (!user.status) {
                    user.status = 1
                    user.admin_id = 0
                    user.is_super = false
                    user.role = 'user'
                  } else if(user.status) {
                    user.role = user.is_super ? 'admin' : 'lowyer'
                  }

                  return user
                }

                if (user === null) {
                  console.error("User not found by username: ", credentials)
                  throw new Error("Пользователь с таким E-mail не найден.");
                }

                console.error("Incorrect password: ", credentials)
                throw new Error("Некорректные введенные E-mail/Password.");
                
              } catch (error) {
                console.error("Failed to fetch SQL select user credentials: ", error)
                throw new Error("Ошибка авторизации: " + (error as Error).message);
              }
            } else {
              console.error("Credentials empty: ", credentials)
              throw new Error("Ошибка авторизации: Некорректные введенные E-mail/Password.");
            }
        },
    })
  ],

  callbacks: {
    async jwt({ token, user }: NextAuthJWTInput) {
      if (user) {
        // 'user' is only present on the first sign-in
        token.id = user.id;
        token.role = user.role; // Add custom field from your user model
        token.is_super = user.is_super !== undefined ? user.is_super : false; 
      }
      return token;
    },

    async session({ session, token }: NextAuthSessionInput) {
      if (token) {
        // Explicitly forward properties from the token to the session object
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.is_super = token.is_super
      }
      return session;
    },
  }
}

// export default NextAuth(authOptions)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }