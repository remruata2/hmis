# Hospital Management System

A comprehensive hospital management system built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Admin Features
- Dashboard with statistics
- CRUD operations for Districts
- CRUD operations for Facility Types
- CRUD operations for Facilities
- CRUD operations for Users
- Patient Registrations list with filters (facility, facility type, date range)
- CSV export for patient registrations

### Facility Features
- Dashboard with statistics
- CRUD operations for Patient Registrations
- CSV export for patient registrations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **CSV Export**: PapaParse

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd hospital-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your database connection string:
```
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_management?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After running the seed script, you can login with:

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Please change the password after first login!

## Database Schema

- **District**: Name
- **FacilityType**: Name
- **Facility**: Name, Facility Type (FK), District (FK)
- **User**: Username, Password (hashed), Facility (FK, nullable), Role (ADMIN/FACILITY)
- **PatientRegistration**: Type (IPD/Casualty/OPD), Name, Father/Husband/Wife Name, DOB, Address, Gender, Referral Status, Diagnosis per UD, Entry Date, Facility (FK)

## Project Structure

```
/app
  /(auth)
    /login
  /admin
    /dashboard
    /districts
    /facility-types
    /facilities
    /users
    /patient-registrations
  /facility
    /dashboard
    /patient-registrations
  /api
    /auth/[...nextauth]
    /admin/...
    /facility/...
/components
  /ui (shadcn components)
  /admin
  /facility
/lib
  /prisma
  /auth
  /utils
/prisma
  schema.prisma
  migrations/
  seed.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma db seed` - Seed the database
- `npx prisma studio` - Open Prisma Studio to view/edit database

## License

This project is private and proprietary.
