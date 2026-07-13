'use client'

import { use } from 'react'
import { LawyerRequestDetailPage } from '@/src/app/components/v2/lawyer-requests/lawyer-request-detail-page'

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <LawyerRequestDetailPage requestId={id} />
}
