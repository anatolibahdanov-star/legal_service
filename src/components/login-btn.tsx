import { useSession, signIn, signOut } from "next-auth/react"

export default function SignInComponent() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        {session?.user?.email} <br />
        (<a href="/admin">Admin</a>)<br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}