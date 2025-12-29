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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Facility {
  id: string
  name: string
  facilityTypeId: string
  districtId: string
  facilityType: { id: string; name: string }
  district: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface District {
  id: string
  name: string
}

interface FacilityType {
  id: string
  name: string
}

export default function FacilitiesPage() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    facilityTypeId: '',
    districtId: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [facilitiesRes, districtsRes, facilityTypesRes] = await Promise.all([
        fetch('/api/admin/facilities'),
        fetch('/api/admin/districts'),
        fetch('/api/admin/facility-types'),
      ])

      const facilitiesResult = await facilitiesRes.json()
      const districtsResult = await districtsRes.json()
      const facilityTypesResult = await facilityTypesRes.json()

      if (facilitiesResult.success) {
        setFacilities(facilitiesResult.data)
      }
      if (districtsResult.success) {
        setDistricts(districtsResult.data)
      }
      if (facilityTypesResult.success) {
        setFacilityTypes(facilityTypesResult.data)
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedFacility(null)
    setFormData({ name: '', facilityTypeId: '', districtId: '' })
    setIsDialogOpen(true)
  }

  const handleEdit = (facility: Facility) => {
    setSelectedFacility(facility)
    setFormData({
      name: facility.name,
      facilityTypeId: facility.facilityTypeId,
      districtId: facility.districtId,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (facility: Facility) => {
    setSelectedFacility(facility)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = selectedFacility
        ? `/api/admin/facilities/${selectedFacility.id}`
        : '/api/admin/facilities'
      const method = selectedFacility ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          selectedFacility
            ? 'Facility updated successfully'
            : 'Facility created successfully'
        )
        setIsDialogOpen(false)
        fetchData()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save facility')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedFacility) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/admin/facilities/${selectedFacility.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        toast.success('Facility deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedFacility(null)
        fetchData()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete facility')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Facilities</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Facility
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[150px]">Facility Type</TableHead>
                <TableHead className="min-w-[150px]">District</TableHead>
                <TableHead className="min-w-[120px]">Created At</TableHead>
                <TableHead className="min-w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No facilities found
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell className="font-medium">{facility.name}</TableCell>
                  <TableCell>{facility.facilityType.name}</TableCell>
                  <TableCell>{facility.district.name}</TableCell>
                  <TableCell>
                    {new Date(facility.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(facility)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(facility)}
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFacility ? 'Edit Facility' : 'Create Facility'}
            </DialogTitle>
            <DialogDescription>
              {selectedFacility
                ? 'Update the facility information'
                : 'Add a new facility to the system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityTypeId">Facility Type</Label>
                <Select
                  value={formData.facilityTypeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, facilityTypeId: value })
                  }
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility type" />
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
                <Label htmlFor="districtId">District</Label>
                <Select
                  value={formData.districtId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, districtId: value })
                  }
                  disabled={isSubmitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : selectedFacility
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Facility</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedFacility?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

