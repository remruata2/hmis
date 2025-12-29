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

    const existing = await prisma.patientRegistration.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return notFoundResponse('Patient registration not found')
    }

    if (existing.facilityId !== session.user.facilityId) {
      return unauthorizedResponse()
    }

    const registration = await prisma.patientRegistration.update({
      where: { id: params.id },
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
          set: [], // Clear existing relations
          connect: Array.isArray(diagnosisIds) ? diagnosisIds.map((id: string) => ({ id })) : []
        },
        entryDate: entryDate ? new Date(entryDate) : existing.entryDate,
      },
      include: {
        diagnoses: true
      }
    })

    return successResponse(registration)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Patient registration not found')
    }
    console.error('Error updating patient registration:', error)
    return errorResponse('Failed to update patient registration', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'FACILITY' || !session.user.facilityId) {
    return unauthorizedResponse()
  }

  try {
    const existing = await prisma.patientRegistration.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return notFoundResponse('Patient registration not found')
    }

    if (existing.facilityId !== session.user.facilityId) {
      return unauthorizedResponse()
    }

    await prisma.patientRegistration.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Patient registration deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse('Patient registration not found')
    }
    return errorResponse('Failed to delete patient registration', 500)
  }
}

