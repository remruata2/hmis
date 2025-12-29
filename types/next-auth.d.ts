import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: 'ADMIN' | 'FACILITY'
      facilityId: string | null
    }
  }

  interface User {
    id: string
    username: string
    role: 'ADMIN' | 'FACILITY'
    facilityId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: 'ADMIN' | 'FACILITY'
    facilityId: string | null
  }
}

