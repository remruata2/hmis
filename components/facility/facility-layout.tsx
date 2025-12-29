'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LayoutDashboard, FileText, LogOut, Menu } from 'lucide-react'

const facilityMenuItems = [
  { href: '/facility/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/facility/patient-registrations', label: 'Patient Registrations', icon: FileText },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
    onLinkClick?.()
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Hospital Management</h1>
        <p className="text-sm text-slate-400 mt-1">Facility Panel</p>
      </div>
      <nav className="px-4 space-y-1 flex-1">
        {facilityMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700 mt-auto">
        <div className="mb-4">
          <p className="text-sm font-medium text-white">
            {session?.user?.username}
          </p>
          <p className="text-xs text-slate-400">Facility User</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  )
}

export function FacilityLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Top Navbar */}
        <header className="lg:hidden sticky top-0 z-50 bg-slate-900 border-b border-slate-700 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r border-slate-700">
                <SheetHeader className="sr-only">
                  <SheetTitle className="text-white">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <SidebarContent onLinkClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-white truncate">Hospital Management</h1>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-white shadow-xl overflow-y-auto z-20">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 flex flex-col min-h-0 overflow-auto">
          <div className="flex-1 p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

