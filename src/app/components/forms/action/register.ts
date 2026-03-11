import { signIn } from "next-auth/react"
import {RegisterFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitRegisterFormAction(data: RegisterFormI): Promise<CustomResponseDataI> {
    const msg = "Action forgot submitRegisterFormAction - "
    const path = "/users/register"
    const request = { 
        "name": data.name, 
        "password": data.password, 
        "email": data.email,
    }
    
    const response = await CustomRequest(path, request)

    if(!response.status) {
        console.error(msg + "Incorrect response", response.error)
        return response
    }
    
    const credentials = {username: data.email, password: data.password}
    console.log(msg + "SignIn:", credentials);
    const responseSignIn = await signIn('credentials', {
        ...credentials,
        redirect: false, // Prevents automatic redirect
    });
    console.log(msg + 'handleSubmit', responseSignIn)

    if(responseSignIn?.error) {
        console.error(msg + "Incorrect response in SignIn", responseSignIn?.error)
        return {
            status: false,
            data: null,
            error: "Ошибка при авторизации. Попробуйте авторизироваться самостоятельно."
        }
    }
    
    return response
}