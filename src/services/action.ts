"use server";
import { redirect } from 'next/navigation';

export async function submitFormAction(formData: FormData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const topic = formData.get("topic");
  const question = formData.get("question");
  console.log('submit action', name, email, topic, question)

  const api_url = process.env.API_URL ?? 'http://localhost/api';
  const openapi_request_timeout = parseInt(process.env.NEXT_PUBLIC_OPENAI_TIMEOUT ?? '1')
  console.log('api url', process.env.API_URL, api_url)
  const request = { "name": name, "email": email, "topic": topic, "question": question }
  console.log('submit action request', request)
  // Call your external API here
  const response = await fetch(api_url + "/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(openapi_request_timeout * 60 * 1000)
  });

  console.log('submit action response', response)

  if (!response.ok) {
    // throw new Error("Failed to submit form");
    console.log("Technical issue with submit form", response, formData)
    const msg = "Technical issue. Please try again"
    redirect('/?msg=' + encodeURIComponent(msg));
  }

  const result = await response.json();
  console.log('submit action result', result)
  const msg = "Your request successfully received. Please wait for our response ASAP on special reply page created for you."
  redirect('/consultation/' + result.uuid + '/?msg=' + encodeURIComponent(msg));
}

