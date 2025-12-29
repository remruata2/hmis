import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    const facilities = await prisma.facility.findMany({
      include: {
        facilityType: true,
        district: true,
      },
      orderBy: { name: 'asc' },
    })
    return successResponse(facilities)
  } catch (error) {
    return errorResponse('Failed to fetch facilities', 500)
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { name, facilityTypeId, districtId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Name is required')
    }

    if (!facilityTypeId || typeof facilityTypeId !== 'string') {
      return errorResponse('Facility type is required')
    }

    if (!districtId || typeof districtId !== 'string') {
      return errorResponse('District is required')
    }

    const facility = await prisma.facility.create({
      data: {
        name: name.trim(),
        facilityTypeId,
        districtId,
      },
      include: {
        facilityType: true,
        district: true,
      },
    })

    return successResponse(facility, 201)
  } catch (error: any) {
    if (error.code === 'P2003') {
      return errorResponse('Invalid facility type or district', 400)
    }
    return errorResponse('Failed to create facility', 500)
  }
}

