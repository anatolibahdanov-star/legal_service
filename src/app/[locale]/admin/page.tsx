"use client"; // This page should be a Client Component

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AdminApp from "@/src/app/components/Admin";

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== "authenticated") return
    if (session?.user?.role === "lowyer") {
      router.replace("/admin/requests")
    }
  }, [status, session?.user?.role, router])

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  if (session?.user?.role === "lowyer") {
    return <p>Перенаправляем в заявки…</p>
  }

  return <AdminApp />;
}