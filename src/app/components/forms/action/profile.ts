import {ProfileFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"
import {User} from "next-auth"

export async function submitProfileFormAction(data: ProfileFormI, user: User): Promise<CustomResponseDataI> {
    const msg = "Action forgot submitProfileFormAction - "
    const path = "/users/profile"
    const request = { 
        "name": data.name, 
        "password": data.password, 
        "oldPassword": data.oldPassword, 
        "confirmPassword": data.confirmPassword,
        "email": user.email,
        "id": user.id,
    }
    
    const response = await CustomRequest(path, request)

    if(!response.status) {
        console.error(msg + "Incorrect response", response.error)
    }
    
    return response
}