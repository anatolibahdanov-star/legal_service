import {RequestFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitRequestFormAction(data: RequestFormI): Promise<CustomResponseDataI> {
    const msg = "Action submitRequestFormAction - "
    const path = "/requests"
    const request = data
    
    const response = await CustomRequest(path, request)

    if(!response.status) console.error(msg + "Incorrect response", response.error)
    
    return response
}