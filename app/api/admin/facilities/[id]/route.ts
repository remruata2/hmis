import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-utils'

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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

    const facility = await prisma.facility.update({
      where: { id: params.id },
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

    return successResponse(facility)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Facility not found')
    }
    if (error.code === 'P2003') {
      return errorResponse('Invalid facility type or district', 400)
    }
    return errorResponse('Failed to update facility', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    await prisma.facility.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Facility deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Facility not found')
    }
    if (error.code === 'P2003') {
      return errorResponse(
        'Cannot delete facility as it is being used',
        409
      )
    }
    return errorResponse('Failed to delete facility', 500)
  }
}

