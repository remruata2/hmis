import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import Papa from 'papaparse';

// Use connection string directly - pg library handles URL-encoded passwords
// For passwords with spaces, use %20 in the DATABASE_URL (e.g., "  " becomes "%20%20")
const dbConfig = {
  connectionString: process.env.DATABASE_URL || '',
}

const pool = new Pool(dbConfig)
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


async function seedICD10() {
  console.log('Seeding ICD-10 codes...');
  const icd10Path = path.join(process.cwd(), 'ICD10.md');

  if (!fs.existsSync(icd10Path)) {
    console.warn(`⚠️  ICD10.md not found at ${icd10Path}, skipping ICD-10 seeding.`);
    return;
  }

  const fileStream = fs.createReadStream(icd10Path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Track the last known parent id for each level.
  // Level 0 (no tab): Chapter (e.g., I Certain infectious...)
  // Level 1 (1 tab): Block (e.g., A00-A09)
  // Level 2 (2 tabs): Category (e.g., A00 Cholera)
  // We can assume max level is enough.
  const parentIds: { [level: number]: string } = {};

  for await (const line of rl) {
    if (!line.trim()) continue;

    // Determine level by counting leading tabs
    let level = 0;
    while (line[level] === '\t') {
      level++;
    }

    const content = line.trim();
    // Assuming format: "CODE Description" or "CODE-RANGE Description"
    // However, some lines might be "I Certain..." or "A00-A09 Intestinal..."
    // We need to split by first whitespace (can be standard space or non-breaking space)
    
    // There are non-breaking spaces in the file (based on previous cat output showing "I\xa0Certain...").
    // We should split by any whitespace.
    const parts = content.split(/[\s\u00A0]+/);
    const code = parts[0];
    const description = parts.slice(1).join(' ');

    if (!code || !description) {
      console.warn(`Skipping malformed line: ${line}`);
      continue;
    }

    try {
      const parentId = level > 0 ? parentIds[level - 1] : null;

      const condition = await prisma.iCD10Condition.upsert({
        where: { code },
        update: {
          description,
          parentId,
        },
        create: {
          code,
          description,
          parentId,
        },
      });

      // Update current level parent
      parentIds[level] = condition.id;

    } catch (error) {
      console.error(`Error processing line: ${line}`, error);
    }
  }
  console.log('✅ ICD-10 seeding completed.');
}

async function seedFacilitiesAndUsers() {
    console.log('Seeding Facilities and Users from CSV...');
    const facilitiesPath = path.join(process.cwd(), 'facilities-report-2025-12-29.csv');
    const usersPath = path.join(process.cwd(), 'users-report-2025-12-29.csv');

    if (!fs.existsSync(facilitiesPath) || !fs.existsSync(usersPath)) {
        console.error('❌ CSV files not found!');
        if (!fs.existsSync(facilitiesPath)) console.error(`Missing: ${facilitiesPath}`);
        if (!fs.existsSync(usersPath)) console.error(`Missing: ${usersPath}`);
        return;
    }

    const facilitiesCsv = fs.readFileSync(facilitiesPath, 'utf8');
    const usersCsv = fs.readFileSync(usersPath, 'utf8');

    // Parse Facilities
    const facilitiesResult = Papa.parse(facilitiesCsv, { header: true, skipEmptyLines: true });
    const facilitiesData = facilitiesResult.data as any[];

    // Parse Users
    const usersResult = Papa.parse(usersCsv, { header: true, skipEmptyLines: true });
    const usersData = usersResult.data as any[];

    console.log(`Found ${facilitiesData.length} facilities and ${usersData.length} users in CSVs.`);

    // 1. Districts & 2. Facility Types
    const uniqueDistricts = new Set<string>();
    const uniqueFacilityTypes = new Set<string>();

    facilitiesData.forEach(row => {
        if (row['District']) uniqueDistricts.add(row['District'].trim());
        if (row['Facility Type']) uniqueFacilityTypes.add(row['Facility Type'].trim());
    });

    // Create Districts
    for (const districtName of uniqueDistricts) {
        await prisma.district.upsert({
            where: { name: districtName },
            update: {},
            create: { name: districtName },
        });
    }
    console.log(`✅ Seeded ${uniqueDistricts.size} districts.`);

    // Create Facility Types
    for (const typeName of uniqueFacilityTypes) {
        await prisma.facilityType.upsert({
            where: { name: typeName },
            update: {},
            create: { name: typeName },
        });
    }
    console.log(`✅ Seeded ${uniqueFacilityTypes.size} facility types.`);

    // 3. Facilities
    // Fetch all districts and types to map IDs
    const districts = await prisma.district.findMany();
    const facilityTypes = await prisma.facilityType.findMany();

    const districtMap = new Map(districts.map(d => [d.name, d.id]));
    const typeMap = new Map(facilityTypes.map(t => [t.name, t.id]));

    let facilitiesCount = 0;
    for (const row of facilitiesData) {
        const name = row['Facility Name']?.trim();
        const districtName = row['District']?.trim();
        const typeName = row['Facility Type']?.trim();

        if (!name || !districtName || !typeName) continue;

        const districtId = districtMap.get(districtName);
        const facilityTypeId = typeMap.get(typeName);

        if (districtId && facilityTypeId) {
             const existing = await prisma.facility.findFirst({
                 where: {
                     name: name,
                     districtId: districtId,
                     facilityTypeId: facilityTypeId
                 }
             });

             if (!existing) {
                 await prisma.facility.create({
                     data: {
                         name,
                         districtId,
                         facilityTypeId
                     }
                 });
                 facilitiesCount++;
             }
        }
    }
    console.log(`✅ Seeded/Checked ${facilitiesCount} new facilities.`);

    // 4. Users
    // Fetch all facilities to link
    const facilities = await prisma.facility.findMany();
    // Create a map for normalization
    const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const facilityMap = new Map(facilities.map(f => [normalize(f.name), f.id]));

    const defaultPassword = await bcrypt.hash('facility123', 10);
    let usersCount = 0;

    for (const row of usersData) {
        const username = row['Username']?.trim();
        const roleRaw = row['Role']?.trim().toUpperCase();
        
        if (!username) continue;

        // Skip if username is 'admin' as it is handled separately in main, or handle here.
        if (username === 'admin') continue;

        const role = roleRaw === 'ADMIN' ? 'ADMIN' : 'FACILITY'; // Default to FACILITY

        // Try to match facility
        const normalizedUsername = normalize(username);
        const facilityId = facilityMap.get(normalizedUsername);

        await prisma.user.upsert({
            where: { username },
            update: {
                facilityId: facilityId || undefined,
            },
            create: {
                username,
                password: defaultPassword,
                role: role as any,
                facilityId: facilityId,
            }
        });
        usersCount++;
    }
    console.log(`✅ Seeded ${usersCount} users.`);
}

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', adminUser.username)
  console.log('📝 Default password: admin123')
  console.log('⚠️  Please change the password after first login!')
  console.log('')

  await seedICD10();
  await seedFacilitiesAndUsers();

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
