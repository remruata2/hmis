import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const facilityId = searchParams.get('facilityId')
    const facilityTypeId = searchParams.get('facilityTypeId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (facilityId) {
      where.facilityId = facilityId
    }

    if (facilityTypeId) {
      where.facility = {
        facilityTypeId: facilityTypeId,
      }
    }

    if (dateFrom || dateTo) {
      where.entryDate = {}
      if (dateFrom) {
        where.entryDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.entryDate.lte = toDate
      }
    }

    const [registrations, total] = await Promise.all([
      prisma.patientRegistration.findMany({
        where,
        include: {
          facility: {
            include: {
              facilityType: true,
              district: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.patientRegistration.count({ where }),
    ])

    return successResponse({
      registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorResponse('Failed to fetch patient registrations', 500)
  }
}

