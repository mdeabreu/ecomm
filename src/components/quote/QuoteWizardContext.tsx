import type { ChangeEvent, RefObject } from 'react'
import { createContext, useContext } from 'react'

import type {
  BulkPreference,
  ColourOption,
  FilePreference,
  MaterialOption,
  ProcessOption,
  SelectedFile,
} from '@/lib/quotes/types'

type QuoteWizardContextValue = {
  applyBulkSelections: () => void
  bulkColourOptions: ColourOption[]
  bulkSelection: BulkPreference
  bulkSelectionReady: boolean
  colourMap: Map<string, ColourOption>
  contactEmail: string
  emailHasError: boolean
  emailIsValid: boolean
  fileInputRef: RefObject<HTMLInputElement>
  files: SelectedFile[]
  getAvailableColoursForMaterial: (materialId: string | null) => ColourOption[]
  getPreferenceForFile: (fileId: string) => FilePreference
  handleBulkSelectionChange: (field: keyof BulkPreference, value: string | null) => void
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  materials: MaterialOption[]
  materialMap: Map<string, MaterialOption>
  notes: string
  processes: ProcessOption[]
  processMap: Map<string, ProcessOption>
  removeFile: (id: string) => void
  requiresEmail: boolean
  setContactEmail: (value: string) => void
  setNotes: (value: string) => void
  updateFilePreference: (fileId: string, updates: Partial<FilePreference>) => void
}

export const QuoteWizardContext = createContext<QuoteWizardContextValue | null>(null)

export const useQuoteWizardContext = () => {
  const context = useContext(QuoteWizardContext)
  if (!context) {
    throw new Error('useQuoteWizardContext must be used within QuoteWizardContext.Provider')
  }
  return context
}
