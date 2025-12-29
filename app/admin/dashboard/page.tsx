import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MapPin,
  Building2,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  HeartPulse,
} from 'lucide-react'

export default async function AdminDashboard() {
  // Get today's date range
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))

  // Get this month's date range
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)

  const [
    districtCount,
    facilityTypeCount,
    facilityCount,
    userCount,
    patientRegistrationCount,
    todayRegistrations,
    monthRegistrations,
    opdCount,
    ipdCount,
    casualtyCount,
    maleCount,
    femaleCount,
    admittedToWardCount,
    referredHigherCount,
    dischargedCount,
    expiredCount,
    topFacilities,
    districtStats,
  ] = await Promise.all([
    prisma.district.count(),
    prisma.facilityType.count(),
    prisma.facility.count(),
    prisma.user.count(),
    prisma.patientRegistration.count(),
    prisma.patientRegistration.count({
      where: { entryDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.patientRegistration.count({
      where: { entryDate: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.patientRegistration.count({ where: { type: 'OPD' } }),
    prisma.patientRegistration.count({ where: { type: 'IPD' } }),
    prisma.patientRegistration.count({ where: { type: 'CASUALTY' } }),
    prisma.patientRegistration.count({ where: { gender: 'MALE' } }),
    prisma.patientRegistration.count({ where: { gender: 'FEMALE' } }),
    prisma.patientRegistration.count({ where: { referredTo: 'IPD' } }),
    prisma.patientRegistration.count({ where: { referredTo: 'HIGHER_CENTRE' } }),
    prisma.patientRegistration.count({ where: { referredTo: 'HOME' } }),
    prisma.patientRegistration.count({ where: { referredTo: 'DEATH' } }),
    // Top 5 facilities by registrations
    prisma.facility.findMany({
      take: 5,
      include: {
        _count: { select: { patientRegistrations: true } },
        district: { select: { name: true } },
      },
      orderBy: { patientRegistrations: { _count: 'desc' } },
    }),
    // District-wise registration stats
    prisma.district.findMany({
      include: {
        facilities: {
          include: { _count: { select: { patientRegistrations: true } } },
        },
      },
    }),
  ])

  // Calculate district totals
  const districtTotals = districtStats.map((d) => ({
    name: d.name,
    facilityCount: d.facilities.length,
    registrationCount: d.facilities.reduce((sum, f) => sum + f._count.patientRegistrations, 0),
  })).sort((a, b) => b.registrationCount - a.registrationCount)

  const systemStats = [
    {
      title: 'Districts',
      value: districtCount,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Facility Types',
      value: facilityTypeCount,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Facilities',
      value: facilityCount,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Users',
      value: userCount,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const registrationStats = [
    {
      title: 'Total Registrations',
      value: patientRegistrationCount,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: "Today's Registrations",
      value: todayRegistrations,
      icon: Calendar,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'This Month',
      value: monthRegistrations,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
  ]

  const typeStats = [
    { label: 'OPD', value: opdCount, color: 'bg-cyan-500' },
    { label: 'IPD', value: ipdCount, color: 'bg-rose-500' },
    { label: 'Casualty', value: casualtyCount, color: 'bg-orange-500' },
  ]

  const outcomeStats = [
    { label: 'Admitted to Ward', value: admittedToWardCount, color: 'bg-blue-500' },
    { label: 'Referred Higher', value: referredHigherCount, color: 'bg-yellow-500' },
    { label: 'Discharged', value: dischargedCount, color: 'bg-green-500' },
    { label: 'Expired', value: expiredCount, color: 'bg-red-500' },
  ]

  const genderPercentage = patientRegistrationCount > 0 ? {
    male: Math.round((maleCount / patientRegistrationCount) * 100),
    female: Math.round((femaleCount / patientRegistrationCount) * 100),
  } : { male: 0, female: 0 }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* System Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStats.map((stat) => {
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
      </div>

      {/* Registration Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Patient Registrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {registrationStats.map((stat) => {
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
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Registration Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typeStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
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

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Male</span>
                  <span className="font-medium">{maleCount} ({genderPercentage.male}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${genderPercentage.male}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Female</span>
                  <span className="font-medium">{femaleCount} ({genderPercentage.female}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${genderPercentage.female}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Facilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Facilities by Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFacilities.map((facility, index) => (
                <div key={facility.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{facility.name}</p>
                      <p className="text-xs text-muted-foreground">{facility.district.name}</p>
                    </div>
                  </div>
                  <span className="font-bold text-lg">{facility._count.patientRegistrations}</span>
                </div>
              ))}
              {topFacilities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* District-wise Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">District-wise Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {districtTotals.slice(0, 5).map((district) => (
                <div key={district.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{district.name}</p>
                    <p className="text-xs text-muted-foreground">{district.facilityCount} facilities</p>
                  </div>
                  <span className="font-bold text-lg">{district.registrationCount}</span>
                </div>
              ))}
              {districtTotals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
