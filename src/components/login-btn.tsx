import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link';

export default function SignInComponent() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        <Link href="/admin" 
          className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center font-small">
        Admin
        </Link>
        <button className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center font-small" onClick={() => signOut()}>SignOut</button>
      </>
    )
  }
  return (
    <>
      <button className="bg-[#3d4b5e] hover:bg-[#2d3b4e] text-white px-6 py-2.5 rounded-lg transition-colors flex items-center font-small" onClick={() => signIn()}>Sign in</button>
    </>
  )
}