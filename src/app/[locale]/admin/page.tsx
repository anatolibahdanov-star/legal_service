"use client"; // This page should be a Client Component

import { useSession, getSession } from "next-auth/react"
import AdminApp from "@/src/components/Admin"; // Adjust the import path as necessary

export default function AdminPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <p>Loading...</p>
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  return <AdminApp />;
}