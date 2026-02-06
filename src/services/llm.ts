// Define the expected types for the request body and response data
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequestBody {
  model: string;
  messages: Message[];
  stream?: boolean; // Optional, set to true for streaming responses
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  // ... other fields
}

/**
 * Sends a request to the OpenAI chat completions API.
 * @param messages The conversation history and current user message.
 * @param apiKey Your OpenAI API key.
 * @returns A Promise that resolves to the API response data.
 */
export async function sendChatRequest(messages: Message[], apiKey: string): Promise<ChatCompletionResponse> {
  const url = "https://api.openai.com";

  const requestBody: ChatCompletionRequestBody = {
    model: "gpt-5-nano", // Or another model like "gpt-4"
    messages: messages,
    // stream: false // Default is false
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  // Check for HTTP errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API request failed: ${errorData.error.message || response.statusText}`);
  }

  // Parse the response body as JSON
  const data: ChatCompletionResponse = await response.json();
  return data;
}