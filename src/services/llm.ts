import OpenAI from "openai";
import * as fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function sendIIBot(question: string): Promise<string | null | undefined> {
    let hints = '\nResponse translate to Russian language.\nLimit response with 1500 symbols.'
    const filePath: string = path.join(process.cwd(), 'src/services/prompt_7.1.md');
    try {
        hints = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error("SEND GPT: Error reading PROMPT file:", error, filePath);
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
        console.error("SEND GPT: Empty response", question);
    } catch (error) {
        console.error("SEND GPT: Error generating response:", error, question);
    }
    return null
}