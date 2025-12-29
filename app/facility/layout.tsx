import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { FacilityLayout } from '@/components/facility/facility-layout'

export default async function FacilityLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'FACILITY') {
    redirect('/login')
  }

  return <FacilityLayout>{children}</FacilityLayout>
}

