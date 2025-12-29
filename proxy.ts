import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isFacility = token?.role === 'FACILITY'
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const isFacilityRoute = req.nextUrl.pathname.startsWith('/facility')

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (isFacilityRoute && !isFacility) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/facility/:path*'],
}

