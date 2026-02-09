'use client';

import { StatusPage } from "@/src/app/components/status-page";
import { useParams } from "next/navigation";


export default function ResultPage() {
  const params = useParams()
  return (
    <StatusPage caseDescription={params.id as string} />
  );
}
