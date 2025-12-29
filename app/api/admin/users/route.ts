import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        facility: {
          include: {
            facilityType: true,
            district: true,
          },
        },
      },
      orderBy: { username: 'asc' },
    })
    return successResponse(users)
  } catch (error) {
    return errorResponse('Failed to fetch users', 500)
  }
}

export async function POST(request: NextRequest) {
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

    if (!password || typeof password !== 'string' || password.length < 6) {
      return errorResponse('Password is required and must be at least 6 characters')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        facilityId: facilityId || null,
        role: role || 'FACILITY',
      },
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
    return successResponse(userWithoutPassword, 201)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Username already exists', 409)
    }
    if (error.code === 'P2003') {
      return errorResponse('Invalid facility', 400)
    }
    return errorResponse('Failed to create user', 500)
  }
}

