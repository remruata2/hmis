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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface FacilityType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function FacilityTypesPage() {
  const router = useRouter()
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFacilityType, setSelectedFacilityType] =
    useState<FacilityType | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchFacilityTypes()
  }, [])

  const fetchFacilityTypes = async () => {
    try {
      const response = await fetch('/api/admin/facility-types')
      const result = await response.json()
      if (result.success) {
        setFacilityTypes(result.data)
      } else {
        toast.error('Failed to fetch facility types')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedFacilityType(null)
    setFormData({ name: '' })
    setIsDialogOpen(true)
  }

  const handleEdit = (facilityType: FacilityType) => {
    setSelectedFacilityType(facilityType)
    setFormData({ name: facilityType.name })
    setIsDialogOpen(true)
  }

  const handleDelete = (facilityType: FacilityType) => {
    setSelectedFacilityType(facilityType)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = selectedFacilityType
        ? `/api/admin/facility-types/${selectedFacilityType.id}`
        : '/api/admin/facility-types'
      const method = selectedFacilityType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          selectedFacilityType
            ? 'Facility type updated successfully'
            : 'Facility type created successfully'
        )
        setIsDialogOpen(false)
        fetchFacilityTypes()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to save facility type')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedFacilityType) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/admin/facility-types/${selectedFacilityType.id}`,
        { method: 'DELETE' }
      )

      const result = await response.json()

      if (result.success) {
        toast.success('Facility type deleted successfully')
        setIsDeleteDialogOpen(false)
        setSelectedFacilityType(null)
        fetchFacilityTypes()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete facility type')
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Facility Types</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Facility Type
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilityTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  No facility types found
                </TableCell>
              </TableRow>
            ) : (
              facilityTypes.map((facilityType) => (
                <TableRow key={facilityType.id}>
                  <TableCell className="font-medium">
                    {facilityType.name}
                  </TableCell>
                  <TableCell>
                    {new Date(facilityType.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(facilityType)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(facilityType)}
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
        <DialogContent className="w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {selectedFacilityType
                ? 'Edit Facility Type'
                : 'Create Facility Type'}
            </DialogTitle>
            <DialogDescription>
              {selectedFacilityType
                ? 'Update the facility type information'
                : 'Add a new facility type to the system'}
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
                  : selectedFacilityType
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Facility Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {selectedFacilityType?.name}
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

