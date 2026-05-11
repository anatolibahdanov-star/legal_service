/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomResponseDataI } from "@/src/interfaces/api"

export const CustomRequest = async (apiPath: string, data: any, method: "POST" | "PUT" = "POST"): Promise<CustomResponseDataI> => {
    const msg = "Send POST CustomRequest - "
    const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
    const openapi_request_timeout = parseInt(process.env.NEXT_PUBLIC_OPENAI_TIMEOUT ?? '1')
    const defaultError = "Возникла техническая ошибка. Попробуйте повторить действие."

    try {
        const request = data
        const response = await fetch(api_url + apiPath, {
            method: method,
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify(request),
            signal: AbortSignal.timeout(openapi_request_timeout * 60 * 1000)
        });

        const responseData = await response.json()
        if(!response?.ok) {
            console.error(msg + "Incorrect response", response?.statusText, apiPath, data)

            let err = defaultError
            if(responseData.message) err = responseData.message
            return {
                status: false,
                data: responseData,
                error: err,
            }
        }

        return {
            status: true,
            data: responseData,
            error: "",
        }
    } catch (error) {
        console.error(msg + 'There was a problem with the fetch operation:', error, apiPath, data);
        
        if (error instanceof Error) {
            console.error(msg + 'Error message:', error.message, apiPath, data);
        } else {
            console.error(msg + 'An unknown error occurred', error, apiPath, data);
        }
    }
    return {
        status: false,
        data: null,
        error: defaultError,
    }
}

export const CustomGetRequest = async (apiPath: string, data: any = {}): Promise<CustomResponseDataI> => {
    const msg = "Send GET CustomRequest - "
    const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
    const defaultError = "Возникла техническая ошибка. Попробуйте повторить действие."

    try {
        // Convert the parameters object to URLSearchParams
        const searchParams = new URLSearchParams(data as Record<string, string>);
        
        // Construct the final URL with the query string
        const finalUrl = `${api_url + apiPath}?${searchParams.toString()}`;
        const response = await fetch(finalUrl, {
            method: "GET",
            headers: {"Content-Type": "application/json",}
        });

        const responseData = await response.json()
        if(!response?.ok) {
            console.error(msg + "Incorrect response", response?.statusText, apiPath, data)
            
            let err = defaultError
            if(responseData.message) err = responseData.message
            return {
                status: false,
                data: null,
                error: err,
            }
        }
        
        const headerValue = parseInt(response.headers.get("X-Total-Count") ?? "0");

        return {
            status: true,
            data: responseData,
            count: headerValue,
            error: "",
        }
    } catch (error) {
        console.error(msg + 'There was a problem with the fetch operation:', error, apiPath, data);
        
        if (error instanceof Error) {
            console.error(msg + 'Error message:', error.message, apiPath, data);
        } else {
            console.error(msg + 'An unknown error occurred', error, apiPath, data);
        }
    }
    return {
        status: false,
        data: null,
        error: defaultError,
    }
}