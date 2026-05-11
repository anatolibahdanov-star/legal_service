import { CustomRequest } from "@/src/libs/request"
import { CustomResponseDataI } from "@/src/interfaces/api"

export async function submitResetPasswordFormAction(
    email: string,
    captchaToken: string,
): Promise<CustomResponseDataI> {
    const path = "/users/reset"
    const request = { email, captchaToken }

    return CustomRequest(path, request)
}
