import { PrismaClient } from './generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use connection string directly - pg library handles URL-encoded passwords
// For passwords with spaces, use %20 in the DATABASE_URL (e.g., "  " becomes "%20%20")
const dbConfig = {
  connectionString: process.env.DATABASE_URL || '',
}

const pool = new Pool(dbConfig)
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

