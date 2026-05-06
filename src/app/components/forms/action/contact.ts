import {ContactFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitContactFormAction(data: ContactFormI): Promise<CustomResponseDataI> {
    const msg = "Action submitContactFormAction - "
    const path = "/contacts"
    const request = data
    
    const response = await CustomRequest(path, request)
    if(!response.status) console.error(msg + "Incorrect response", response.error)
    
    return response
}