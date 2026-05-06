import {RatingFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitRatingFormAction(data: RatingFormI): Promise<CustomResponseDataI> {
    const msg = "Action submitRequestFormAction - "
    const path = "/requests/" + data.id
    const request = data
    
    const response = await CustomRequest(path, request)

    if(!response.status) console.error(msg + "Incorrect response", response.error)
    
    return response
}