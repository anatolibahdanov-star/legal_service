import { getProviders } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { redirect } from 'next/navigation';
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route"
import SigninFormComponent from "@/src/components/login-form"

export default async function SignInPage(){
  const session = await getServerSession(authOptions)

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return redirect('/');
  }

  const providers = await getProviders()
  const _providers = providers ?? []
  console.log("_providers", _providers)
  return (
    <div className="content">
      {Object.values(_providers).map((provider) => (
        <SigninFormComponent key={provider.id} provider={provider} />
      ))}
    </div>
  )
}