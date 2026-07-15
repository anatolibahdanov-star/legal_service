"use client"; // This page should be a Client Component

// Temporary comparison route: mounts the pre-redesign react-admin UI
// (same AdminApp as /admin) without the lawyer redirect that /admin has,
// so the old lawyer-facing "requests" screens can be viewed side-by-side
// with the new /admin/requests pages. Safe to delete once the comparison
// is done — nothing else depends on this route.
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AdminApp from "@/src/app/components/Admin";

export default function LegacyAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== "authenticated") return
    if (session?.user?.role === "user") {
      router.replace("/profile")
    }
  }, [status, session?.user?.role, router])

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  if (session?.user?.role === "user") {
    return <p>Доступ запрещён.</p>
  }

  return <AdminApp />;
}
