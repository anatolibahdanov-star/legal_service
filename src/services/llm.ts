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
    const url = process.env.CONSULTANT_API_URL ?? "https://ai.conslegal.ru/"
    const credentials = process.env.CONSULTANT_API_CREDENTIALS ?? ""
    const postData: ConsultantPostDataI = {
        context: [{user: question}],
        query: question,
        queryId: "2e4dfec0-b079-4c19-91ba-7d0d5a3c534b",
        sid: "82dbec20-93c5-41b9-893d-c9dfa6fbda85",
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST', // or 'POST', 'PUT', etc.
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json', // Add other headers as needed
            },
            signal: AbortSignal.timeout(3 * 60 * 1000),
            body: JSON.stringify(postData)
            // Optional: use 'no-cors' mode for cross-origin requests if necessary, but 
            // be aware that the Authorization header may be restricted in that mode
            // mode: 'cors', // Default value, usually what you want
        });

        if (!response.ok) {
            // Handle non-successful responses (e.g., 401 Unauthorized)
            
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success:', data);
        return data;

    } catch (error) {
        console.error("(ERROR)" + msg + "Error fetching data:", error, question);
    }
    return null
}