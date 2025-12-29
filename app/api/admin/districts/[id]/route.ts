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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Name is required')
    }

    const district = await prisma.district.update({
      where: { id: params.id },
      data: { name: name.trim() },
    })

    return successResponse(district)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('District not found')
    }
    if (error.code === 'P2002') {
      return errorResponse('District with this name already exists', 409)
    }
    return errorResponse('Failed to update district', 500)
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
    await prisma.district.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'District deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('District not found')
    }
    if (error.code === 'P2003') {
      return errorResponse(
        'Cannot delete district as it is being used by facilities',
        409
      )
    }
    return errorResponse('Failed to delete district', 500)
  }
}

