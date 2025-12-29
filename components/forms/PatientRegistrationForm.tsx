'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { AsyncMultiSelect, Option } from '@/components/ui/async-multi-select'

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
    // referralStatus: string // Deprecated
    // diagnosisPerUD: string // Deprecated
    diagnoses: { code: string; description: string; id: string }[]
    entryDate: string
}

interface PatientRegistrationFormProps {
    type: string
    initialData?: PatientRegistration | null
    onSubmit: (data: any) => Promise<void>
    isSubmitting: boolean
    onCancel?: () => void
}

const COMPLAINT_OPTIONS = [
    'General Ailment',
    'ANC Antenatal Care',
    'PNC Postnatal Care',
    'NCD Hypertension',
    'NCD Diabetes Mellitus',
    'NCD Common Cancer',
    'Others',
]

export function PatientRegistrationForm({
    type,
    initialData,
    onSubmit,
    isSubmitting,
    onCancel,
}: PatientRegistrationFormProps) {
    const [formData, setFormData] = useState({
        type: type,
        name: initialData?.name || '',
        fatherHusbandWifeName: initialData?.fatherHusbandWifeName || '',
        dob: initialData?.dob ? format(new Date(initialData.dob), 'yyyy-MM-dd') : '',
        address: initialData?.address || '',
        gender: initialData?.gender || 'MALE',
        referredFrom: initialData?.referredFrom || 'NA',
        referredTo: initialData?.referredTo || 'NA',
        complaints: initialData?.complaints || [],
        otherComplaint: initialData?.otherComplaint || '',
        entryDate: initialData?.entryDate
            ? format(new Date(initialData.entryDate), 'yyyy-MM-dd')
            : '',
    })

    const [selectedDiagnoses, setSelectedDiagnoses] = useState<Option[]>(
        initialData?.diagnoses?.map(d => ({
            value: d.id,
            label: `${d.code} - ${d.description}`
        })) || []
    )

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const submitData = {
            ...formData,
            type,
            diagnosisIds: selectedDiagnoses.map(d => d.value)
        }
        onSubmit(submitData)
    }

    const searchDiagnoses = async (query: string): Promise<Option[]> => {
        const res = await fetch(`/api/icd10/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (json.success) {
            return json.data.map((item: any) => ({
                value: item.id,
                label: `${item.code} - ${item.description}`
            }))
        }
        return []
    }

    const handleComplaintChange = (checked: boolean, complaint: string) => {
        if (checked) {
            setFormData({
                ...formData,
                complaints: [...formData.complaints, complaint],
            })
        } else {
            setFormData({
                ...formData,
                complaints: formData.complaints.filter((c) => c !== complaint),
            })
        }
    }

    // Filter admission source options based on registration type
    const getAdmissionSourceOptions = () => {
        const allOptions = [
            { value: 'NA', label: 'NA / Direct' },
            { value: 'OPD', label: 'From OPD' },
            { value: 'CASUALTY', label: 'From Casualty' },
            { value: 'OTHER_FACILITY', label: 'From Other Facility' },
        ]

        // Remove "From OPD" option when in OPD tab
        if (type === 'OPD') {
            return allOptions.filter(opt => opt.value !== 'OPD')
        }

        // Remove "From Casualty" option when in Casualty tab
        if (type === 'CASUALTY') {
            return allOptions.filter(opt => opt.value !== 'CASUALTY')
        }

        // Show all options for IPD
        return allOptions
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                <span className="text-sm font-medium text-muted-foreground">Registration Type</span>
                <Badge variant="default" className="text-base px-4 py-1">
                    {type}
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fatherHusbandWifeName">Father/Husband/Wife Name</Label>
                    <Input
                        id="fatherHusbandWifeName"
                        value={formData.fatherHusbandWifeName}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                fatherHusbandWifeName: e.target.value,
                            })
                        }
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        disabled={isSubmitting}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="referredFrom">Admission Source (Referred From)</Label>
                    <Select
                        value={formData.referredFrom}
                        onValueChange={(value) =>
                            setFormData({ ...formData, referredFrom: value })
                        }
                        disabled={isSubmitting}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {getAdmissionSourceOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="referredTo">Outcome</Label>
                    <Select
                        value={formData.referredTo}
                        onValueChange={(value) =>
                            setFormData({ ...formData, referredTo: value })
                        }
                        disabled={isSubmitting}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NA">NA / Under Treatment</SelectItem>
                            <SelectItem value="IPD">Admit to Ward (IPD)</SelectItem>
                            <SelectItem value="HIGHER_CENTRE">Referred to Higher Centre</SelectItem>
                            <SelectItem value="HOME">Discharged / Home</SelectItem>
                            <SelectItem value="DEATH">Expired / Death</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="entryDate">Entry Date</Label>
                <Input
                    id="entryDate"
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) =>
                        setFormData({ ...formData, entryDate: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label>Complaints</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {COMPLAINT_OPTIONS.map((complaint) => (
                        <div key={complaint} className="flex items-center space-x-2">
                            <Checkbox
                                id={complaint}
                                checked={formData.complaints.includes(complaint)}
                                onCheckedChange={(checked) => handleComplaintChange(checked as boolean, complaint)}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor={complaint} className="text-sm font-normal cursor-pointer">
                                {complaint}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {formData.complaints.includes('Others') && (
                <div className="space-y-2">
                    <Label htmlFor="otherComplaint">Other Complaint Details</Label>
                    <Input
                        id="otherComplaint"
                        value={formData.otherComplaint}
                        onChange={(e) => setFormData({ ...formData, otherComplaint: e.target.value })}
                        disabled={isSubmitting}
                        placeholder="Specify other complaints..."
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="diagnoses">Diagnosis per ICD-10</Label>
                <AsyncMultiSelect
                    placeholder="Search diagnosis (e.g. Cholera)..."
                    onSearch={searchDiagnoses}
                    onChange={setSelectedDiagnoses}
                    initialSelected={selectedDiagnoses}
                />
            </div>

            <div className="flex justify-end gap-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    )
}
