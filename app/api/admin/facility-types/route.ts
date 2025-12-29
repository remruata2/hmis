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
    const facilityTypes = await prisma.facilityType.findMany({
      orderBy: { name: 'asc' },
    })
    return successResponse(facilityTypes)
  } catch (error) {
    return errorResponse('Failed to fetch facility types', 500)
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Name is required')
    }

    const facilityType = await prisma.facilityType.create({
      data: { name: name.trim() },
    })

    return successResponse(facilityType, 201)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Facility type with this name already exists', 409)
    }
    return errorResponse('Failed to create facility type', 500)
  }
}

