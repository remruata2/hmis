import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'FACILITY' || !session.user.facilityId) {
    return unauthorizedResponse()
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const search = searchParams.get('search') || ''

    const where: any = {
      facilityId: session.user.facilityId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fatherHusbandWifeName: { contains: search, mode: 'insensitive' } },
      ]
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
          diagnoses: true,
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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'FACILITY' || !session.user.facilityId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const {
      type,
      name,
      fatherHusbandWifeName,
      dob,
      address,
      gender,
      referredFrom,
      referredTo,
      complaints,
      otherComplaint,
      diagnosisIds,
      entryDate,
    } = body

    if (!type || !name || !fatherHusbandWifeName || !dob || !address || !gender) {
      return errorResponse('All fields are required')
    }

    const registration = await prisma.patientRegistration.create({
      data: {
        type,
        name: name.trim(),
        fatherHusbandWifeName: fatherHusbandWifeName.trim(),
        dob: new Date(dob),
        address: address.trim(),
        gender,
        referredFrom,
        referredTo,
        complaints: Array.isArray(complaints) ? complaints : [],
        otherComplaint: otherComplaint?.trim(),
        diagnoses: {
          connect: Array.isArray(diagnosisIds) ? diagnosisIds.map((id: string) => ({ id })) : []
        },
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        facilityId: session.user.facilityId,
      },
      include: {
        diagnoses: true
      }
    })

    return successResponse(registration, 201)
  } catch (error: any) {
    console.error('Error creating patient registration:', error)
    return errorResponse('Failed to create patient registration', 500)
  }
}

