'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { formatPatientRegistrationForExport, exportToCSV } from '@/lib/csv-export'
import { format } from 'date-fns'

interface PatientRegistration {
  id: string
  type: string
  name: string
  fatherHusbandWifeName: string
  dob: string
  address: string
  gender: string
  referralStatus: string
  diagnosisPerUD: string
  entryDate: string
  facility: {
    id: string
    name: string
    facilityType: { id: string; name: string }
    district: { id: string; name: string }
  }
}

interface Facility {
  id: string
  name: string
  facilityTypeId: string
}

interface FacilityType {
  id: string
  name: string
}

export default function PatientRegistrationsPage() {
  const [registrations, setRegistrations] = useState<PatientRegistration[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    facilityId: '',
    facilityTypeId: '',
    dateFrom: '',
    dateTo: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchFacilitiesAndTypes()
  }, [])

  useEffect(() => {
    fetchRegistrations()
  }, [filters, pagination.page])

  const fetchFacilitiesAndTypes = async () => {
    try {
      const [facilitiesRes, facilityTypesRes] = await Promise.all([
        fetch('/api/admin/facilities'),
        fetch('/api/admin/facility-types'),
      ])

      const facilitiesResult = await facilitiesRes.json()
      const facilityTypesResult = await facilityTypesRes.json()

      if (facilitiesResult.success) {
        setFacilities(facilitiesResult.data)
      }
      if (facilityTypesResult.success) {
        setFacilityTypes(facilityTypesResult.data)
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const fetchRegistrations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.facilityId) {
        params.append('facilityId', filters.facilityId)
      }
      if (filters.facilityTypeId) {
        params.append('facilityTypeId', filters.facilityTypeId)
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom)
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo)
      }

      const response = await fetch(
        `/api/admin/patient-registrations?${params.toString()}`
      )
      const result = await response.json()

      if (result.success) {
        setRegistrations(result.data.registrations)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to fetch patient registrations')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()

      if (filters.facilityId) {
        params.append('facilityId', filters.facilityId)
      }
      if (filters.facilityTypeId) {
        params.append('facilityTypeId', filters.facilityTypeId)
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom)
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo)
      }

      params.append('limit', '10000')

      const response = await fetch(
        `/api/admin/patient-registrations?${params.toString()}`
      )
      const result = await response.json()

      if (result.success) {
        const exportData = result.data.registrations.map(
          formatPatientRegistrationForExport
        )
        const filename = `patient-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
        exportToCSV(exportData, filename)
        toast.success('Export completed successfully')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('An error occurred during export')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Patient Registrations
        </h1>
        <Button onClick={handleExport} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="facilityType">Facility Type</Label>
            <Select
              value={filters.facilityTypeId || undefined}
              onValueChange={(value) => handleFilterChange('facilityTypeId', value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All facility types" />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility">Facility</Label>
            <Select
              value={filters.facilityId || undefined}
              onValueChange={(value) => handleFilterChange('facilityId', value || '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All facilities" />
              </SelectTrigger>
              <SelectContent>
                {facilities
                  .filter(
                    (f) =>
                      !filters.facilityTypeId ||
                      f.facilityTypeId === filters.facilityTypeId
                  )
                  .map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">Type</TableHead>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[150px]">Father/Husband/Wife</TableHead>
                    <TableHead className="min-w-[100px]">DOB</TableHead>
                    <TableHead className="min-w-[80px]">Gender</TableHead>
                    <TableHead className="min-w-[120px]">Referral Status</TableHead>
                    <TableHead className="min-w-[150px]">Diagnosis</TableHead>
                    <TableHead className="min-w-[100px]">Entry Date</TableHead>
                    <TableHead className="min-w-[200px]">Facility</TableHead>
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
                        <TableCell>{registration.referralStatus}</TableCell>
                        <TableCell>{registration.diagnosisPerUD}</TableCell>
                        <TableCell>
                          {format(new Date(registration.entryDate), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>
                          {registration.facility.name} (
                          {registration.facility.facilityType.name},{' '}
                          {registration.facility.district.name})
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
    </div>
  )
}

