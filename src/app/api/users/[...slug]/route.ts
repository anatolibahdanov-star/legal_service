// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {login} from "@/src/repositories/users/repo"
import {DBUser} from "@/src/interfaces/db"

export async function GET(request: NextRequest) {
  const msg = "API USER GET: "
  const requestUrlId = request.url.split('/api/users/')[1];
  let result: boolean = false
  try {
    switch(requestUrlId) {
      case "logout":
        result = true
        break;
      default:
        break;
    }
  } catch(err) {
      console.error("(ERROR)" + msg, (err as Error).message)
      return NextResponse.json(
          { success: false, message: '(ERROR)' + msg + 'error during get question info.' },
          { status: 401 }
      );
  }
  console.log(msg + 'response out', result, requestUrlId)
  const response = NextResponse.json(result, { status: 200 });
  response.headers.set("X-Total-Count", "1")
  return response 
}

export async function POST(request: Request) {
  const msg = "API USER POST: "
  const requestUrlId = request.url.split('/api/users/')[1];
  const data = await request.json();
  let user: DBUser | null | undefined = null
  try {
    switch(requestUrlId) {
      case "login":
        user = await login(data.email, data.password)
        console.log(msg + 'user', requestUrlId, user)
        if(user === undefined) {
          console.error("(ERROR)" + msg + 'incorrect login password', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'incorrect login password.', requestUrlId, data},
              { status: 401 }
          );
        } else if(user === null) {
          console.error("(ERROR)" + msg + 'not found.', requestUrlId, data)
          return NextResponse.json(
              { success: false, message: '(ERROR)' + msg + 'not found.', requestUrlId, data},
              { status: 404 }
          );
        }

        break;
      case "register":
        break;
      default:
        console.error("(ERROR)" + msg + 'incorrect request.', requestUrlId, data)
        return NextResponse.json(
            { success: false, message: '(ERROR)' + msg + 'incorrect request.', requestUrlId, data},
            { status: 404 }
        );
        break;
    }
  } catch(err) {
      console.error("(ERROR)" + msg, (err as Error).message, requestUrlId, data)
      return NextResponse.json(
          { success: false, message: '(ERROR)' + msg + 'error during get user info.', requestUrlId, data},
          { status: 401 }
      );
  }

  console.log(msg + 'response out', user)
  const response = NextResponse.json(user, { status: 200 });
  response.headers.set("X-Total-Count", "1")
  return response 
}
