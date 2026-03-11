import { CustomRequest } from "@/src/libs/request"

export async function submitResetPasswordFormAction(email: string): Promise<boolean> {
    const path = "/users/reset"
    const request = {email: email}
    
    const response = await CustomRequest(path, request)
    return response.status
}