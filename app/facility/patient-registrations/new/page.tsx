'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientRegistrationForm } from '@/components/forms/PatientRegistrationForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PatientRegistration {
    id: string
    type: string
    name: string
    fatherHusbandWifeName: string
    dob: string
    address: string
    gender: string
    referralStatus: string
    // diagnosisPerUD: string
    diagnoses: { code: string; description: string; id: string }[]
    entryDate: string
}

export default function NewPatientRegistrationPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (data: Omit<PatientRegistration, 'id'>) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/facility/patient-registrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Patient registration created successfully')
                router.push('/facility/patient-registrations')
                router.refresh()
            } else {
                toast.error(result.error || 'Failed to create patient registration')
            }
        } catch {
            toast.error('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full px-4 py-6 md:container md:mx-auto max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-8 w-8 shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                        New Patient Registration
                    </h1>
                </div>
            </div>

            <Tabs defaultValue="OPD" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="OPD">OPD</TabsTrigger>
                    <TabsTrigger value="IPD">IPD</TabsTrigger>
                    <TabsTrigger value="CASUALTY">Casualty</TabsTrigger>
                </TabsList>

                <TabsContent value="OPD">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">OPD Registration</h2>
                            <p className="text-sm text-gray-500">
                                Enter details for new OPD patient
                            </p>
                        </div>
                        <PatientRegistrationForm
                            type="OPD"
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onCancel={() => router.back()}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="IPD">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">IPD Registration</h2>
                            <p className="text-sm text-gray-500">
                                Enter details for new IPD patient
                            </p>
                        </div>
                        <PatientRegistrationForm
                            type="IPD"
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onCancel={() => router.back()}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="CASUALTY">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">Casualty Registration</h2>
                            <p className="text-sm text-gray-500">
                                Enter details for new Casualty patient
                            </p>
                        </div>
                        <PatientRegistrationForm
                            type="CASUALTY"
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            onCancel={() => router.back()}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
