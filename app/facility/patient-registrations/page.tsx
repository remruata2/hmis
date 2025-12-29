'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatPatientRegistrationForExport, exportToCSV } from '@/lib/csv-export'
import { format } from 'date-fns'
import { PatientRegistrationForm } from '@/components/forms/PatientRegistrationForm'

interface PatientRegistration {
  id: string
  type: string
  name: string
  fatherHusbandWifeName: string
  dob: string
  address: string
  gender: string
  referredFrom?: string
  referredTo?: string
  complaints: string[]
  otherComplaint?: string
  // referralStatus: string
  // diagnosisPerUD: string
  diagnoses: { code: string; description: string; id: string }[]
  entryDate: string
}

export default function FacilityPatientRegistrationsPage() {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<PatientRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] =
    useState<PatientRegistration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Update fetchRegistrations to use search state directly if available, or passed params
  const fetchRegistrations = useCallback(async (currentSearch = searchQuery) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: currentSearch,
      })

      const response = await fetch(
        `/api/facility/patient-registrations?${params.toString()}`
      )
      const result = await response.json()

      if (result.success) {
        setRegistrations(result.data.registrations)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to fetch patient registrations')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit]) // searchQuery is intentionally omitted to avoid loops

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only trigger fetch if search query changed or on initial load
      // Reset page to 1 when searching
      setPagination(prev => ({ ...prev, page: 1 }))
      fetchRegistrations(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery]) // Re-run when searchQuery changes

  const handleCreate = () => {
    router.push('/facility/patient-registrations/new')
  }

  const handleEdit = (registration: PatientRegistration) => {
    setSelectedRegistration(registration)
    setIsEditOpen(true)
  }

  const handleDelete = (registration: PatientRegistration) => {
    setSelectedRegistration(registration)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdate = async (data: Omit<PatientRegistration, 'id'>) => {
    if (!selectedRegistration) return
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/facility/patient-registrations/${selectedRegistration.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      const result = await response.json()

      if (result.success) {
        toast.success('Patient registration updated successfully')
        setIsEditOpen(false)
        fetchRegistrations()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update patient registration')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedRegistration) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/facility/patient-registrations/${selectedRegistration.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        toast.success('Patient registration deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedRegistration(null)
        fetchRegistrations()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete patient registration')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000',
        search: searchQuery
      })

      const response = await fetch(
        `/api/facility/patient-registrations?${params.toString()}`
      )
      const result = await response.json()

      if (result.success) {
        const exportData = result.data.registrations.map((reg: PatientRegistration) =>
          formatPatientRegistrationForExport(reg)
        )
        const filename = `patient-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
        exportToCSV(exportData, filename)
        toast.success('Export completed successfully')
      } else {
        toast.error('Failed to export data')
      }
    } catch {
      toast.error('An error occurred during export')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Patient Registrations
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Registration
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">Type</TableHead>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[150px]">Father/Husband/Wife</TableHead>
                    <TableHead className="min-w-[100px]">DOB</TableHead>
                    <TableHead className="min-w-[80px]">Gender</TableHead>
                    <TableHead className="min-w-[120px]">Referred From / Outcome</TableHead>
                    <TableHead className="min-w-[150px]">Diagnosis</TableHead>
                    <TableHead className="min-w-[100px]">Entry Date</TableHead>
                    <TableHead className="min-w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-gray-500"
                      >
                        No patient registrations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>{registration.type}</TableCell>
                        <TableCell className="font-medium">
                          {registration.name}
                        </TableCell>
                        <TableCell>
                          {registration.fatherHusbandWifeName}
                        </TableCell>
                        <TableCell>
                          {format(new Date(registration.dob), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>{registration.gender}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            {registration.referredFrom && <span>From: {registration.referredFrom}</span>}
                            {registration.referredTo && (
                              <span className={registration.referredFrom ? 'mt-1' : ''}>
                                To: {registration.referredTo}
                              </span>
                            )}
                            {!registration.referredFrom && !registration.referredTo && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {registration.diagnoses?.map((d) => d.code).join(', ') || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(registration.entryDate), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(registration)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(registration)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {registrations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No patient registrations found
                </div>
              ) : (
                registrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold">
                            {registration.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {registration.type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(registration)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(registration)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-semibold">Relation:</span>{' '}
                          {registration.fatherHusbandWifeName}
                        </div>
                        <div>
                          <span className="font-semibold">DOB:</span>{' '}
                          {format(new Date(registration.dob), 'yyyy-MM-dd')}
                        </div>
                        <div>
                          <span className="font-semibold">Gender:</span>{' '}
                          {registration.gender}
                        </div>
                        <div>
                          <span className="font-semibold">Entry Date:</span>{' '}
                          {format(new Date(registration.entryDate), 'yyyy-MM-dd')}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Diagnosis:</span>{' '}
                        {registration.diagnoses?.map((d) => d.code).join(', ') || '-'}
                      </div>
                      <div>
                        <span className="font-semibold">Referral:</span>{' '}
                        {registration.referredFrom ? `From: ${registration.referredFrom}` : ''}
                        {registration.referredFrom && registration.referredTo ? ' -> ' : ''}
                        {registration.referredTo ? `To: ${registration.referredTo}` : ''}
                        {!registration.referredFrom && !registration.referredTo ? '-' : ''}
                      </div>
                      <div>
                        <span className="font-semibold">Complaints:</span>{' '}
                        {registration.complaints?.join(', ') || '-'}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            {pagination.totalPages > 1 && (
              <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                  of {pagination.total} results
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="flex-1 sm:flex-initial"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="flex-1 sm:flex-initial"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient Registration</DialogTitle>
            <DialogDescription>
              Update the patient registration information
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <PatientRegistrationForm
              type={selectedRegistration.type}
              initialData={selectedRegistration}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the registration for &quot;
              {selectedRegistration?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
