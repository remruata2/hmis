import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Activity, Calendar, TrendingUp, HeartPulse, Home, AlertCircle } from 'lucide-react'

export default async function FacilityDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'FACILITY' || !session.user.facilityId) {
    redirect('/login')
  }

  const facilityId = session.user.facilityId

  // Get today's date range
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))

  // Get this month's date range
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)

  // Fetch all stats in parallel
  const [
    totalCount,
    todayCount,
    monthCount,
    opdCount,
    ipdCount,
    casualtyCount,
    maleCount,
    femaleCount,
    otherGenderCount,
    todayOpdCount,
    todayIpdCount,
    todayCasualtyCount,
    admittedToWardCount,
    referredHigherCount,
    dischargedCount,
    expiredCount,
  ] = await Promise.all([
    // Total registrations
    prisma.patientRegistration.count({ where: { facilityId } }),
    // Today's registrations
    prisma.patientRegistration.count({
      where: { facilityId, entryDate: { gte: todayStart, lte: todayEnd } },
    }),
    // This month's registrations
    prisma.patientRegistration.count({
      where: { facilityId, entryDate: { gte: monthStart, lte: monthEnd } },
    }),
    // By type - All time
    prisma.patientRegistration.count({ where: { facilityId, type: 'OPD' } }),
    prisma.patientRegistration.count({ where: { facilityId, type: 'IPD' } }),
    prisma.patientRegistration.count({ where: { facilityId, type: 'CASUALTY' } }),
    // By gender
    prisma.patientRegistration.count({ where: { facilityId, gender: 'MALE' } }),
    prisma.patientRegistration.count({ where: { facilityId, gender: 'FEMALE' } }),
    prisma.patientRegistration.count({ where: { facilityId, gender: 'OTHER' } }),
    // Today by type
    prisma.patientRegistration.count({
      where: { facilityId, type: 'OPD', entryDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.patientRegistration.count({
      where: { facilityId, type: 'IPD', entryDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.patientRegistration.count({
      where: { facilityId, type: 'CASUALTY', entryDate: { gte: todayStart, lte: todayEnd } },
    }),
    // Outcomes
    prisma.patientRegistration.count({ where: { facilityId, referredTo: 'IPD' } }),
    prisma.patientRegistration.count({ where: { facilityId, referredTo: 'HIGHER_CENTRE' } }),
    prisma.patientRegistration.count({ where: { facilityId, referredTo: 'HOME' } }),
    prisma.patientRegistration.count({ where: { facilityId, referredTo: 'DEATH' } }),
  ])

  const summaryStats = [
    {
      title: 'Total Registrations',
      value: totalCount,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: "Today's Registrations",
      value: todayCount,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'This Month',
      value: monthCount,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  const typeStats = [
    {
      title: 'OPD Patients',
      value: opdCount,
      todayValue: todayOpdCount,
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'IPD Patients',
      value: ipdCount,
      todayValue: todayIpdCount,
      icon: HeartPulse,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      title: 'Casualty Patients',
      value: casualtyCount,
      todayValue: todayCasualtyCount,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const outcomeStats = [
    { label: 'Admitted to Ward (IPD)', value: admittedToWardCount, color: 'bg-blue-500' },
    { label: 'Referred to Higher Centre', value: referredHigherCount, color: 'bg-yellow-500' },
    { label: 'Discharged / Home', value: dischargedCount, color: 'bg-green-500' },
    { label: 'Expired / Death', value: expiredCount, color: 'bg-red-500' },
  ]

  const genderPercentage = totalCount > 0 ? {
    male: Math.round((maleCount / totalCount) * 100),
    female: Math.round((femaleCount / totalCount) * 100),
    other: Math.round((otherGenderCount / totalCount) * 100),
  } : { male: 0, female: 0, other: 0 }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Registration by Type */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Registrations by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {typeStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Today: <span className="font-medium">{stat.todayValue}</span>
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout for Gender & Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Male</span>
                <span className="font-medium">{maleCount} ({genderPercentage.male}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${genderPercentage.male}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Female</span>
                <span className="font-medium">{femaleCount} ({genderPercentage.female}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full"
                  style={{ width: `${genderPercentage.female}%` }}
                />
              </div>

              {otherGenderCount > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Other</span>
                    <span className="font-medium">{otherGenderCount} ({genderPercentage.other}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${genderPercentage.other}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outcomeStats.map((outcome) => (
                <div key={outcome.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${outcome.color}`} />
                    <span className="text-sm text-gray-600">{outcome.label}</span>
                  </div>
                  <span className="font-medium">{outcome.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
