import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import {login, profile, register, reset, getUsersByIds, saveUser, deleteUser, issueEmailVerificationToken} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"
import { SendSendGridEmailForgot, SendSendGridEmailVerifyNewEmail } from '@/src/libs/sendgrid';
import { EmailDataForgotI } from '@/src/interfaces/email';
import { verifyCaptcha } from "@/src/libs/captcha"
import { maskEmail } from "@/src/helpers/maskEmail"
import { isPhoneEmail } from "@/src/libs/phoneIdentity"

export const dynamic = 'force-dynamic';

function sanitizeUser(user: DBUser | null | undefined): Record<string, unknown> | null {
  if (!user) return null;
  const safe: Record<string, unknown> = { ...user };
  delete safe.password;
  delete safe.temp_password;
  delete safe.email_verify_token;
  return safe;
}

type AccessResult =
  | { ok: true; isSelf: boolean; isStaff: boolean }
  | { ok: false; status: number; message: string };

async function authorizeUserAccess(targetId: string): Promise<AccessResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: 'Требуется авторизация.' };
  }
  const isSelf = session.user.id.toString() === targetId;
  const isStaff = session.user.role !== 'user';
  if (!isSelf && !isStaff) {
    return { ok: false, status: 403, message: 'Доступ запрещён.' };
  }
  return { ok: true, isSelf, isStaff };
}
export async function GET(request: NextRequest) {
  const msg = "API USER GET: "
  // console.log(msg + "request", request)
  const rawId = request.url.split('/api/users/')[1];
  const auth = await authorizeUserAccess(rawId);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
  }
  const requestUrlId = parseInt(rawId);
  console.log(msg + 'requestUrlId', requestUrlId, typeof requestUrlId)

  let user: DBUser | null = null
  try {
      user = await getUsersByIds([requestUrlId.toString()])
      console.log(msg + 'get user', user)
      if (user === null) {
          console.error(msg + "User not found", requestUrlId)
          return NextResponse.json(
              { success: false, message: msg + 'User not found.' },
              { status: 404 }
          );
      }
  } catch(err) {
      console.error("(ERROR)" + msg, (err as Error).message)
      return NextResponse.json(
          { success: false, message: '(ERROR)' + msg + 'error during get data.' },
          { status: 401 }
      );
  }
  console.log(msg + 'user out', user)
  const response = NextResponse.json(sanitizeUser(user), { status: 200 });
  response.headers.set("X-Total-Count", "1")
  return response
}

export async function POST(request: Request) {
  const requestUrlId = request.url.split('/api/users/')[1];
  const msg = "API USER POST - " + requestUrlId + ' '
  const data = await request.json();
  let user: DBUser | null | undefined = null
  try {
    switch(requestUrlId) {
      case "login":
        user = await login(data.email, data.password)
        logger.info(msg + 'user', requestUrlId, user)
        if(user === undefined) {
          logger.error("(ERROR)" + msg + 'incorrect login password', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'incorrect login password.', requestUrlId, data},
              { status: 401 }
          );
        } else if(user === null) {
          logger.error("(ERROR)" + msg + 'not found.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'not found or blocked.', requestUrlId, data},
              { status: 404 }
          );
        }

        break;
      case "profile":
        if (data.password !== data.confirmPassword) {
          logger.error("(ERROR)" + msg + 'passwords not equal.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'incorrect confirmed password.', requestUrlId, data},
              { status: 401 }
          );
        }
        user = await profile(data.id, data.name, data.password, data.oldPassword)
        logger.info(msg + 'user', requestUrlId, user)
        if(user === undefined) {
          logger.error("(ERROR)" + msg + 'incorrect old password', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: 'Вы ввели неверный текущий пароль.', requestUrlId, data},
              { status: 401 }
          );
        } else if(user === null) {
          logger.error("(ERROR)" + msg + 'not found.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: 'Пользователь не найден.', requestUrlId, data},
              { status: 404 }
          );
        }

        break;
      case "register":
        user = await register(data.name, data.email, data.password)
        logger.info(msg + 'user', requestUrlId, user)
        if(user === undefined) {
          logger.error("(ERROR)" + msg + 'already exist with such email', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: 'Пользователь с таким E-mail уже зарегистрирован.', requestUrlId, data},
              { status: 401 }
          );
        } else if(user === null) {
          logger.error("(ERROR)" + msg + 'Error during adding.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: 'Технические неполадки. Попробуйте повторить через 3 минуты.', requestUrlId, data},
              { status: 404 }
          );
        }
        break;
      case "reset":
        if (!data.email) {
          logger.error("(ERROR)" + msg + 'email is empty.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'empty recovery email.', requestUrlId, data},
              { status: 401 }
          );
        }
        const resetCaptcha = await verifyCaptcha(data.captchaToken, null)
        if (!resetCaptcha.success) {
          logger.warn(msg + 'captcha rejected on reset', { reason: resetCaptcha.reason })
          return NextResponse.json(
              { success: false, message: 'CAPTCHA введена не верно.' },
              { status: 400 }
          );
        }
        user = await reset(data.email)
        logger.info(msg + 'user', requestUrlId, user?.id)
        if(!user) {
          logger.error("(ERROR)" + msg + 'not found.', requestUrlId, data?.email)
          return NextResponse.json(
              { success: false, message: 'Аккаунт с таким E-mail не найден.', requestUrlId},
              { status: 404 }
          );
        }
        const domainUrl = process.env.NEXTAUTH_URL ?? 'https://localhost'
        const emailData: EmailDataForgotI = {
          recipient: user.email,
          username: user.name,
          password: user.password,
          url: domainUrl,
          url_about: domainUrl + '/about/',
        }
        const isSendEmail = await SendSendGridEmailForgot(emailData)
        if(!isSendEmail) {
            logger.error("(ERROR)" + msg + "reset email was not sent", { user_id: user.id })
            return NextResponse.json(
                { success: false, message: 'Возникла техническая ошибка при отправке почты.', requestUrlId},
                { status: 500 }
            );
        }
        // Strip the plaintext password before responding — the client only
        // needs a confirmation + the masked email for the success screen.
        return NextResponse.json(
            { success: true, maskedEmail: maskEmail(user.email) },
            { status: 200 }
        );
      default:
        logger.error("(ERROR)" + msg + 'incorrect request.', requestUrlId, data)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'incorrect request.', requestUrlId, data},
            { status: 404 }
        );
        break;
    }
  } catch(err) {
      logger.error("(ERROR)" + msg, (err as Error).message, requestUrlId, data)
      return NextResponse.json(
          { success: false, message: '(ERROR)' + msg + 'error during get user info.', requestUrlId, data},
          { status: 401 }
      );
  }

  logger.info(msg + 'response out', user)
  const response = NextResponse.json(sanitizeUser(user), { status: 200 });
  response.headers.set("X-Total-Count", "1")
  return response
}

export async function PUT(request: Request) {
    const msg = "API USER PUT: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/users/')[1];
    const auth = await authorizeUserAccess(requestUrlId);
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }
    const updatedUser: DBUser = await request.json();
    if (typeof updatedUser.email === 'string') {
        updatedUser.email = updatedUser.email.trim();
    }

    let user: DBUser | null = null
    try {
        const before = await getUsersByIds([requestUrlId])
        const oldEmail = before?.email ?? null

        user = await saveUser(requestUrlId, updatedUser)
        console.log(msg + 'user', user)
        if (user === null) {
            console.error(msg + "User not found", requestUrlId)
            return NextResponse.json(
                { success: false, message: msg + 'User not found.' },
                { status: 404 }
            );
        }

        const newEmail = updatedUser.email ?? ''
        const emailChanged = auth.isSelf && !!newEmail && !!oldEmail
            && newEmail.toLowerCase() !== oldEmail.toLowerCase()
            && !isPhoneEmail(newEmail)
        if (emailChanged) {
            const token = await issueEmailVerificationToken(requestUrlId)
            if (!token) {
                logger.error("(ERROR)" + msg + "could not issue verification token", { user_id: requestUrlId })
            } else {
                const base = (process.env.NEXTAUTH_URL ?? 'https://enki.legal').replace(/\/$/, '')
                const verifyUrl = `${base}/api/users/verify-email?token=${encodeURIComponent(token)}`
                const sent = await SendSendGridEmailVerifyNewEmail({
                    recipient: newEmail,
                    username: user.name ?? '',
                    url: verifyUrl,
                })
                if (!sent) {
                    logger.error("(ERROR)" + msg + "new-email verification letter not sent", { user_id: requestUrlId })
                }
            }
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during save data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'updated', user)
    const fresh = await getUsersByIds([requestUrlId])
    const response = NextResponse.json(sanitizeUser(fresh ?? user), { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function DELETE(request: Request) {
    const msg = "API USER DELETE: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/users/')[1];
    const auth = await authorizeUserAccess(requestUrlId);
    if (!auth.ok) {
        return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    let user: DBUser | null = null
    try {
        user = await deleteUser(requestUrlId)
        console.log(msg + 'deleted', user)
        if (user === null) {
            console.error(msg + "User not found", requestUrlId)
            return NextResponse.json(
                { success: false, message: msg + 'User not found.' },
                { status: 404 }
            );
        }
    } catch(err) {
        console.error("(ERROR)" + msg, (err as Error).message)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'error during deleting data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'deleted', user)
    const response = NextResponse.json(sanitizeUser(user), { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}
