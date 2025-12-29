import 'dotenv/config';
import { PrismaClient } from './lib/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
    const count = await prisma.iCD10Condition.count();
    console.log(`Total ICD10 Codes: ${count}`);

    const chapter = await prisma.iCD10Condition.findFirst({
        where: { code: 'I' },
        include: { children: true }
    });

    if (chapter) {
        console.log(`Chapter I found: ${chapter.description}`);
        console.log(`Chapter I children count: ${chapter.children.length}`);
        if (chapter.children.length > 0) {
            console.log(`First child: ${chapter.children[0].code} - ${chapter.children[0].description}`);
        }
    } else {
        console.log('Chapter I NOT found');
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
