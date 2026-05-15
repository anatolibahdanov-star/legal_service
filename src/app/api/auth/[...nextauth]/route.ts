import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import {getAdministratorByEmail, getAdministratorByEmailOnly} from "@/src/repositories/administrators/repo"
import {login, getUserByEmail, getUserByPhone} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"
import {NextAuthSessionInput, NextAuthJWTInput} from "@/src/interfaces/custom-next-auth"
import logger from "@/src/libs/logger"
import { UserStatusesE } from "@/src/interfaces/data"
import { consumeVerifyToken } from "@/src/libs/otpStore"
import { normalizePhoneE164 } from "@/src/libs/phoneIdentity"
import { verifyCaptcha } from "@/src/libs/captcha"
import {
  getLoginStatus,
  recordFailedLogin,
  resetLoginAttempts,
  LOCKOUT_TRIGGER_ATTEMPTS as LOGIN_LOCKOUT_TRIGGER,
} from "@/src/repositories/login_attempts/repo"

const GENERIC_LOGIN_ERROR = "Неверный email или пароль."
const BLOCKED_EMAIL_MESSAGE = "Ваш Email заблокирован. Свяжитесь с тех.поддержкой."
const LOCKED_15MIN_MESSAGE = "Слишком много попыток. Попробуйте через 15 минут."
const CAPTCHA_ERROR = "CAPTCHA введена не верно."

interface LoginErrorPayload {
  code: 'invalid_creds' | 'lock_15min' | 'blocked' | 'captcha';
  message: string;
  attemptsLeft?: number;
  lockedUntil?: string;
}
const encodeLoginError = (payload: LoginErrorPayload): string => JSON.stringify(payload);
const remainingAttempts = (used: number): number => Math.max(0, LOGIN_LOCKOUT_TRIGGER - used);

const isBlocked = (entity: DBUser): boolean =>
  entity.status !== undefined && entity.status !== null && entity.status !== UserStatusesE.Activated

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
            password: { label: "Password", type: "password" },
            captchaToken: { label: "Captcha Token", type: "text" }
        },

        async authorize(credentials: Record<string, string> | undefined): Promise<DBUser | null> {
          const msg = "API next-auth ROUTE - "
          logger.info(msg + "auth credentials", { username: credentials?.username, has_captcha: !!credentials?.captchaToken })

          if (!credentials || !("username" in credentials) || !("password" in credentials)) {
            logger.error(msg + "credentials empty")
            throw new Error(encodeLoginError({ code: 'invalid_creds', message: GENERIC_LOGIN_ERROR }))
          }

          const email = credentials.username?.trim()
          const password = credentials.password
          const captchaToken = credentials.captchaToken

          if (captchaToken) {
            const captcha = await verifyCaptcha(captchaToken, null)
            if (!captcha.success) {
              logger.error(msg + "captcha rejected", { reason: captcha.reason })
              throw new Error(encodeLoginError({ code: 'captcha', message: CAPTCHA_ERROR }))
            }
          }

          if (!email || !password) {
            const fail = await recordFailedLogin(email || 'unknown')
            throw new Error(encodeLoginError({ code: 'invalid_creds', message: GENERIC_LOGIN_ERROR, attemptsLeft: remainingAttempts(fail.attempts) }))
          }

          const lock = await getLoginStatus(email)
          if (lock.locked) {
            logger.warn(msg + "email locked", { email, remaining_sec: lock.lockedRemainingSec })
            throw new Error(encodeLoginError({
              code: 'lock_15min',
              message: LOCKED_15MIN_MESSAGE,
              lockedUntil: lock.lockedUntil?.toISOString(),
            }))
          }

          const adminRow = await getAdministratorByEmailOnly(email)
          const userRow = adminRow ? null : await getUserByEmail(email)
          const accountRow = adminRow ?? userRow

          if (!accountRow) {
            const fail = await recordFailedLogin(email)
            logger.warn(msg + "email not found", { email, attempts: fail.attempts, action: fail.action })
            if (fail.action === 'lock_15min') {
              throw new Error(encodeLoginError({
                code: 'lock_15min',
                message: LOCKED_15MIN_MESSAGE,
                lockedUntil: fail.lockedUntil?.toISOString(),
              }))
            }
            throw new Error(encodeLoginError({ code: 'invalid_creds', message: GENERIC_LOGIN_ERROR, attemptsLeft: remainingAttempts(fail.attempts) }))
          }

          if (isBlocked(accountRow)) {
            logger.warn(msg + "account blocked", { email, status: accountRow.status })
            throw new Error(encodeLoginError({ code: 'blocked', message: BLOCKED_EMAIL_MESSAGE }))
          }

          let verified: DBUser | null = null
          if (adminRow) {
            const adminVerified = await getAdministratorByEmail(email, password)
            if (adminVerified) verified = adminVerified
          } else {
            const userVerified = await login(email, password)
            if (userVerified) verified = userVerified
          }

          if (!verified) {
            const fail = await recordFailedLogin(email)
            logger.warn(msg + "wrong password", { email, attempts: fail.attempts, action: fail.action })
            if (fail.action === 'lock_15min') {
              throw new Error(encodeLoginError({
                code: 'lock_15min',
                message: LOCKED_15MIN_MESSAGE,
                lockedUntil: fail.lockedUntil?.toISOString(),
              }))
            }
            throw new Error(encodeLoginError({ code: 'invalid_creds', message: GENERIC_LOGIN_ERROR, attemptsLeft: remainingAttempts(fail.attempts) }))
          }

          await resetLoginAttempts(email)

          if (verified.is_super === undefined && verified.is_register !== undefined) {
            verified.status = UserStatusesE.Activated
            verified.admin_id = 0
            verified.is_super = false
            verified.username = ''
            verified.role = 'user'
          } else if (verified.status) {
            verified.role = verified.is_super ? 'admin' : 'lowyer'
          }

          return verified
        },
    }),
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        verifyToken: { label: 'Verify Token', type: 'text' },
      },
      async authorize(credentials: Record<string, string> | undefined): Promise<DBUser | null> {
        const msg = 'API next-auth phone-otp - '
        if (!credentials || !credentials.phone || !credentials.verifyToken) {
          logger.error(msg + 'missing credentials')
          throw new Error('Не передан телефон или токен подтверждения.')
        }
        const normalized = normalizePhoneE164(credentials.phone)
        if (!normalized) {
          logger.error(msg + 'invalid phone')
          throw new Error('Некорректный номер телефона.')
        }
        if (!consumeVerifyToken(normalized.e164, credentials.verifyToken)) {
          logger.error(msg + 'invalid or expired verify token', { phone_tail: normalized.digits.slice(-4) })
          throw new Error('Сессия подтверждения истекла. Повторите регистрацию.')
        }
        const user = await getUserByPhone(normalized.e164)
        if (!user) {
          logger.error(msg + 'user not found after verify', { phone_tail: normalized.digits.slice(-4) })
          throw new Error('Пользователь не найден. Повторите регистрацию.')
        }
        user.role = 'user'
        user.admin_id = 0
        user.is_super = false
        user.username = ''
        user.status = UserStatusesE.Activated
        return user
      },
    })
  ],

  callbacks: {
    async jwt({ token, user }: NextAuthJWTInput) {
      if (user) {
        // 'user' is only present on the first sign-in
        token.id = user.id;
        token.role = user.role; // Add custom field from your user model
        token.username = user.username
        token.is_super = user.is_super !== undefined ? user.is_super : false;
      }
      return token;
    },

    async session({ session, token }: NextAuthSessionInput) {
      if (token) {
        // Explicitly forward properties from the token to the session object
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.is_super = token.is_super
      }
      return session;
    },
  }
}

// export default NextAuth(authOptions)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
