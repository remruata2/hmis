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
import bcrypt from 'bcryptjs'

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
    const { username, password, facilityId, role } = body

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return errorResponse('Username is required')
    }

    const updateData: any = {
      username: username.trim(),
      facilityId: facilityId || null,
      role: role || 'FACILITY',
    }

    if (password && typeof password === 'string' && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        facility: {
          include: {
            facilityType: true,
            district: true,
          },
        },
      },
    })

    const { password: _, ...userWithoutPassword } = user
    return successResponse(userWithoutPassword)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('User not found')
    }
    if (error.code === 'P2002') {
      return errorResponse('Username already exists', 409)
    }
    if (error.code === 'P2003') {
      return errorResponse('Invalid facility', 400)
    }
    return errorResponse('Failed to update user', 500)
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
    await prisma.user.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'User deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('User not found')
    }
    return errorResponse('Failed to delete user', 500)
  }
}

