import Papa from 'papaparse'
import { format } from 'date-fns'

export interface PatientRegistrationExport {
  type: string
  name: string
  fatherHusbandWifeName: string
  dob: string
  address: string
  gender: string
  referralStatus: string
  diagnosisPerUD: string
  entryDate: string
  facilityName: string
  facilityType: string
  district: string
}

export function exportToCSV(data: PatientRegistrationExport[], filename: string) {
  const csv = Papa.unparse(data, {
    header: true,
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatPatientRegistrationForExport(registration: any): PatientRegistrationExport {
  return {
    type: registration.type,
    name: registration.name,
    fatherHusbandWifeName: registration.fatherHusbandWifeName,
    dob: format(new Date(registration.dob), 'yyyy-MM-dd'),
    address: registration.address,
    gender: registration.gender,
    referralStatus: registration.referralStatus,
    diagnosisPerUD: registration.diagnosisPerUD,
    entryDate: format(new Date(registration.entryDate), 'yyyy-MM-dd'),
    facilityName: registration.facility?.name || '',
    facilityType: registration.facility?.facilityType?.name || '',
    district: registration.facility?.district?.name || '',
  }
}

export interface UserExportRow {
  username: string
  role: string
  facilityName: string
  facilityType: string
  district: string
  createdAt: string
  facilityPassword: string
}

export function exportUsersToCSV(rows: UserExportRow[], filename: string) {
  const csv = Papa.unparse(rows, {
    header: true,
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
