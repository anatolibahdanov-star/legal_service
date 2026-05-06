import { NextRequest, NextResponse } from 'next/server';
import {login, profile, register, reset, getUsersByIds, saveUser, deleteUser} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"
import logger from "@/src/libs/logger"
import { SendSendGridEmailForgot } from '@/src/libs/sendgrid';
import { EmailDataForgotI } from '@/src/interfaces/email';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const msg = "API USER GET: "
  // console.log(msg + "request", request)
  const requestUrlId = parseInt(request.url.split('/api/users/')[1]);
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
  const response = NextResponse.json(user, { status: 200 });
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
        user = await reset(data.email)
        logger.info(msg + 'user', requestUrlId, user)
        if(!user) {
          logger.error("(ERROR)" + msg + 'not found.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: 'Пользователь с таким емэйлом не найден.', requestUrlId, data},
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
            logger.error("(ERROR)" + msg + "email on question ready was not sent", emailData)
            return NextResponse.json(
                { success: false, message: 'Возникла техническая ошибка при отправке почты.', requestUrlId, data},
                { status: 404 }
            );
        }
        break;
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
  const response = NextResponse.json(user, { status: 200 });
  response.headers.set("X-Total-Count", "1")
  return response 
}

export async function PUT(request: Request) {
    const msg = "API USER PUT: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/users/')[1];
    const updatedUser: DBUser = await request.json(); 

    let user: DBUser | null = null
    try {
        user = await saveUser(requestUrlId, updatedUser)
        console.log(msg + 'user', user)
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
            { success: false, message: '(ERROR)' + msg + 'error during save data.' },
            { status: 401 }
        );
    }
    console.log(msg + 'updated', user)
    const response = NextResponse.json(user, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}

export async function DELETE(request: Request) {
    const msg = "API USER DELETE: "
    // console.log(msg + "request", request)
    const requestUrlId = request.url.split('/api/users/')[1];

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
    const response = NextResponse.json(user, { status: 200 });
    response.headers.set("X-Total-Count", "1")
    return response
}
