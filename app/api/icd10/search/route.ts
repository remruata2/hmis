
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
        return NextResponse.json({ success: true, data: [] })
    }

    try {
        const results = await prisma.iCD10Condition.findMany({
            where: {
                OR: [
                    { code: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                // Only fetch leaf nodes (codes that have no children)
                children: {
                    none: {}
                }
            },
            take: 20,
            orderBy: {
                code: 'asc',
            },
        })

        return NextResponse.json({ success: true, data: results })
    } catch (error) {
        console.error('Error searching ICD-10:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to search ICD-10 codes' },
            { status: 500 }
        )
    }
}
