import {RequestFormI} from "@/src/interfaces/form"
import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitRequestFormAction(
    data: RequestFormI,
    captchaToken?: string,
): Promise<CustomResponseDataI> {
    const msg = "Action submitRequestFormAction - "
    const path = "/requests"
    // Follow-up questions are submitted without a captcha token; only attach it
    // when present (brand-new questions).
    const request = captchaToken ? { ...data, captchaToken } : { ...data }

    const response = await CustomRequest(path, request)

    if(!response.status) console.error(msg + "Incorrect response", response.error)

    return response
}
