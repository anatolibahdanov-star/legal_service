import OpenAI from "openai";
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import * as fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConsultantContextI {
    user: string
}

interface ConsultantPostDataI {
    context: ConsultantContextI[];
    query: string;
    queryId: string;
    sid: string;
}

interface ConsultantPostAIResponseI {
    aiReply: string;
    queryClass: string;
    queryId: string;
    isFixed: boolean;
}

interface ConsultantPostAIResponseOtherI {
    aiReply: string;
    queryClass: string;
    queryId: string;
    isFixed: boolean;
}

interface ConsultantPostResponseI {
    aiResponse: ConsultantPostAIResponseI,
    seeAlsoResponse: ConsultantPostAIResponseOtherI,
}

export async function sendIIBot(question: string): Promise<string | null | undefined> {
    const msg = "SEND Consultant PLUS: "
    let hints = '\nResponse translate to Russian language.\nLimit response with 1500 symbols.'
    const filePath: string = path.join(process.cwd(), 'src/services/prompt_7.1.md');
    try {
        hints = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error("(ERROR)" + msg + "Error reading PROMPT file:", error, filePath);
    }

    try {
        const response = await openai.responses.create({
            model: process.env.OPENAI_MODEL,
            input: question + hints,
            store: true,
            reasoning: {"effort": "medium"},
        });
        if(response) {
            return response.output_text
        }
        console.error("(ERROR)" + msg + "Empty response", question);
    } catch (error) {
        console.error("(ERROR)" + msg + "Error generating response:", error, question);
    }
    return null
}

export async function sendGrokBot(question: string): Promise<string | null | undefined> {
    const msg = "SEND GROK: "
    let hints = '\nResponse translate to Russian language.\nLimit response with 1500 symbols.'
    const filePath: string = path.join(process.cwd(), 'src/services/prompt_7.1.md');
    try {
        hints = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error("(ERROR)" + msg + "Error reading PROMPT file:", error, filePath);
    }

    try {
        const { text } = await generateText({
            model: xai('grok-4'), // Specify the model, e.g., 'grok-1' or 'grok-3'
            prompt: 'Explain the importance of low-latency LLMs in a witty tone.',
        });

        if(text) {
            return text
        }
        console.error("(ERROR)" + msg + "Empty response", question);
    } catch (error) {
        console.error("(ERROR)" + msg + "Error generating response:", error, question);
    }
    return null
}

export async function sendConsultantPlusBot(question: string): Promise<ConsultantPostResponseI | null | undefined> {
    const msg = "SEND Consultant PLUS: "
    const url = (process.env.CONSULTANT_API_URL ?? "https://ai.conslegal.ru/") + "request"
    
    const postData: ConsultantPostDataI = {
        context: [{user: question}],
        query: question,
        queryId: "82d902d8-cc90-49f3-8f42-c33c3dadcb04", // 2e4dfec0-b079-4c19-91ba-7d0d5a3c534b
        sid: "f0c59eca-1ef7-47aa-bb70-56282aa14213", // 82dbec20-93c5-41b9-893d-c9dfa6fbda85
    }



    
    // try {
    //     const response = await myFetcher(url, "limits")
    //     const setCookieHeaders = response.headers.getSetCookie();
    //     setCookieHeaders.forEach(cookieString => {
    //         console.log(msg + 'Received cookie1:', cookieString);
    //         // You might use a library like 'cookie' or 'set-cookie-parser' to manage these
    //     });

    //     if (!response.ok) {
    //         // Handle non-successful responses (e.g., 401 Unauthorized)
    //         console.error("(ERROR)" + msg + " error in response1 ", response);
    //         throw new Error(`HTTP error! status1: ${response.status}`);
    //     }

    //     // const clonedResponse = response.clone();
    //     // const data = await clonedResponse.json();
    //     // console.log('Success1:', data);
    //     // return data;
    //     return null

    // } catch (error) {
    //     console.error("(ERROR)" + msg + "Error fetching data1:", error, question);
    // }


    try {
        const response = await myFetcher(url, "request", JSON.stringify(postData))
        // const response = await fetch(url + "request", {
        //     method: 'POST', // or 'POST', 'PUT', etc.
        //     headers: {
        //         'Accept': '*/*',
        //         'Accept-Encoding': 'gzip, deflate, br, zstd',
        //         'Accept-Language': 'en-US,en;q=0.9',
        //         'Cache-Control': 'no-cache',
        //         'Connection': 'keep-alive',
        //         'Content-Length': '0',
        //         'CP-User': '71d8a22f-c675-435c-869a-914fca25052a',
        //         'Host': 'ai.conslegal.ru',
        //         'Origin': 'https://ai.conslegal.ru',
        //         'Referer': 'https://ai.conslegal.ru',
        //         'Priority': 'u=4',
        //         'Pragma': 'no-cache',
        //         'Sec-Fetch-Dest': 'empty',
        //         'Sec-Fetch-Mode': 'cors',
        //         'Sec-Fetch-Site': 'same-origin',
        //         'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        //         'Authorization': `Basic ${credentials}`,
        //         'Cookie': `UPS_UUID4A6B5E4F=E0AF8344-8318-408A-B222-CABC97549D55`,
        //         'Content-Type': 'text/plain;charset=UTF-8', // Add other headers as needed
        //     },
        //     signal: AbortSignal.timeout(3 * 60 * 1000),
        //     credentials: 'include',
        //     body: JSON.stringify(postData)
        //     // Optional: use 'no-cors' mode for cross-origin requests if necessary, but 
        //     // be aware that the Authorization header may be restricted in that mode
        //     // mode: 'cors', // Default value, usually what you want
        // });
        const setCookieHeaders = response.headers.getSetCookie();
        setCookieHeaders.forEach(cookieString => {
            console.log(msg + 'Received cookie2:', cookieString);
            // You might use a library like 'cookie' or 'set-cookie-parser' to manage these
        });

        if (response === null || !response.ok) {
            // Handle non-successful responses (e.g., 401 Unauthorized)
            console.error("(ERROR)" + msg + " error in response2 ", response);
            throw new Error(`HTTP error! status2: ${response}`);
        }

        // const data = await response.json();
        // console.log('Success2:', data);
        // return data;
        return null

    } catch (error) {
        console.error("(ERROR)" + msg + "Error fetching data2:", error, question);
    }
    return null
}

const myFetcher = async (url: string, path: string, postData: string|null = null) => {
    const credentials = btoa(process.env.CONSULTANT_API_CREDENTIALS ?? "")
    const res = await fetch(url + path, {
        method: 'POST', // or 'POST', 'PUT', etc.
        headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'CP-User': '71d8a22f-c675-435c-869a-914fca25052a',
            'Host': 'ai.conslegal.ru',
            'Origin': 'https://ai.conslegal.ru',
            'Referer': 'https://ai.conslegal.ru',
            'Priority': 'u=4',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Authorization': `Basic ${credentials}`,
            'Cookie': `UPS_UUID4A6B5E4F=E0AF8344-8318-408A-B222-CABC97549D55`,
            'Content-Type': 'application/json', // Add other headers as needed
        },
        signal: AbortSignal.timeout(10 * 60 * 1000),
        credentials: 'include',
        body: postData
    });
    const response = res.clone()

  /**
   * Response body must be consumed to avoid socket error.
   * https://github.com/nodejs/undici/issues/583#issuecomment-855384858
   */
  res.body?.getReader()

  const arrayBuffer: ArrayBuffer = await response.arrayBuffer();

    // 3. Decode the ArrayBuffer into a string using TextDecoder (assuming UTF-8 encoding)
    // Uint8Array is a typed array that represents the buffer in a specific format.
    const decoder = new TextDecoder('utf-8');
    const result: string = decoder.decode(arrayBuffer);
  console.log('result ', result)

//   const data = await res.body?.getReader(). //
//   console.log('data ', data)

//   const data2 = await response.json() //
//   console.log('data2 ', data2)

  // There’s no point returning `res`: it is consumed by the previous line.
  return res
};