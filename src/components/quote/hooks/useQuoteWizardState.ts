import { useCallback, useEffect, useMemo, useState } from 'react'

import type {
  BulkPreference,
  CompletedQuote,
  CompletedQuoteItem,
  FilePreference,
  SelectedFile,
} from '@/lib/quotes/types'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type UseQuoteWizardStateArgs = {
  initialEmail?: string | null
  requiresEmail: boolean
  totalSteps: number
}

type UseQuoteWizardStateResult = {
  activeStep: number
  addFiles: (incomingFiles: File[]) => number
  allFilesConfigured: boolean
  applyBulkSelections: () => void
  bulkSelection: BulkPreference
  canMoveForward: boolean
  completedQuote: CompletedQuote | null
  contactEmail: string
  emailHasError: boolean
  emailIsValid: boolean
  error: string | null
  files: SelectedFile[]
  filePreferences: Record<string, FilePreference>
  goToStep: (nextStep: number) => void
  handleBulkSelectionChange: (field: keyof BulkPreference, value: string | null) => void
  isSubmitting: boolean
  normalizedEmail: string
  notes: string
  removeFile: (id: string) => void
  resetWizard: () => void
  setCompletedQuote: React.Dispatch<React.SetStateAction<CompletedQuote | null>>
  setContactEmail: React.Dispatch<React.SetStateAction<string>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  setNotes: React.Dispatch<React.SetStateAction<string>>
  updateFilePreference: (fileId: string, updates: Partial<FilePreference>) => void
}

export const useQuoteWizardState = ({
  initialEmail,
  requiresEmail,
  totalSteps,
}: UseQuoteWizardStateArgs): UseQuoteWizardStateResult => {
  const [activeStep, setActiveStep] = useState(0)
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedQuote, setCompletedQuote] = useState<CompletedQuote | null>(null)
  const [contactEmail, setContactEmail] = useState(initialEmail ?? '')
  const [filePreferences, setFilePreferences] = useState<Record<string, FilePreference>>({})
  const [bulkSelection, setBulkSelection] = useState<BulkPreference>({
    material: null,
    colour: null,
    process: null,
  })
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (initialEmail) {
      setContactEmail(initialEmail)
    }
  }, [initialEmail])

  const normalizedEmail = contactEmail.trim()

  const emailIsValid = useMemo(() => {
    if (!requiresEmail) return true
    return normalizedEmail.length > 0 && EMAIL_REGEX.test(normalizedEmail)
  }, [normalizedEmail, requiresEmail])

  const emailHasError = useMemo(() => {
    if (!requiresEmail) return false
    if (contactEmail.length === 0) return false
    return !EMAIL_REGEX.test(normalizedEmail)
  }, [contactEmail, normalizedEmail, requiresEmail])

  const allFilesConfigured = useMemo(() => {
    if (!files.length) return false
    return files.every((file) => {
      const prefs = filePreferences[file.id]
      if (!prefs) return false
      return Boolean(prefs.material && prefs.colour && prefs.process && prefs.quantity > 0)
    })
  }, [filePreferences, files])

  const canMoveForward = useMemo(() => {
    if (activeStep === 0) return files.length > 0
    if (activeStep === 1) return allFilesConfigured
    return false
  }, [activeStep, allFilesConfigured, files.length])

  const addFiles = useCallback((incomingFiles: File[]) => {
    if (!incomingFiles.length) return 0

    const additions: SelectedFile[] = []

    setFiles((prev) => {
      const existingFingerprints = new Set(prev.map((item) => `${item.file.name}-${item.file.size}`))

      incomingFiles.forEach((file) => {
        const fingerprint = `${file.name}-${file.size}`
        if (existingFingerprints.has(fingerprint)) return
        existingFingerprints.add(fingerprint)
        additions.push({
          file,
          id: crypto.randomUUID(),
        })
      })

      if (!additions.length) {
        return prev
      }

      return [...prev, ...additions]
    })

    if (additions.length) {
      setFilePreferences((prev) => {
        const next = { ...prev }
        additions.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = { material: null, colour: null, process: null, quantity: 1 }
          }
        })
        return next
      })
    }

    return additions.length
  }, [])

  const updateFilePreference = useCallback((fileId: string, updates: Partial<FilePreference>) => {
    setFilePreferences((prev) => {
      const next = { ...prev }
      const existing = next[fileId]
        ? { ...next[fileId] }
        : { material: null, colour: null, process: null, quantity: 1 }

      if (Object.prototype.hasOwnProperty.call(updates, 'material')) {
        const material = updates.material ?? null
        if (existing.material !== material) {
          existing.material = material
          existing.colour = null
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'colour')) {
        existing.colour = updates.colour ?? null
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'process')) {
        existing.process = updates.process ?? null
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'quantity')) {
        const rawQuantity = updates.quantity
        const normalizedQuantity =
          typeof rawQuantity === 'number' && Number.isFinite(rawQuantity) && rawQuantity > 0
            ? Math.floor(rawQuantity)
            : 1
        existing.quantity = normalizedQuantity
      }

      next[fileId] = existing
      return next
    })
  }, [])

  const handleBulkSelectionChange = useCallback(
    (field: keyof BulkPreference, value: string | null) => {
      setBulkSelection((prev) => {
        const next = { ...prev }
        if (field === 'material') {
          next.material = value
          next.colour = null
        } else {
          next[field] = value
        }
        return next
      })
    },
    [],
  )

  const applyBulkSelections = useCallback(() => {
    if (!bulkSelection.material || !bulkSelection.colour || !bulkSelection.process) {
      setError('Select material, colour, and process before applying to all models.')
      return
    }

    files.forEach((file) => {
      updateFilePreference(file.id, {
        material: bulkSelection.material,
        colour: bulkSelection.colour,
        process: bulkSelection.process,
      })
    })

    setError(null)
  }, [bulkSelection.colour, bulkSelection.material, bulkSelection.process, files, updateFilePreference])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    setFilePreferences((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const goToStep = useCallback(
    (nextStep: number) => {
      setActiveStep((current) => {
        if (nextStep < 0) return 0
        if (nextStep >= totalSteps) return Math.max(0, totalSteps - 1)
        return nextStep
      })
      setError(null)
    },
    [totalSteps],
  )

  const resetWizard = useCallback(() => {
    setActiveStep(0)
    setFiles([])
    setError(null)
    setIsSubmitting(false)
    setFilePreferences({})
    setBulkSelection({ material: null, colour: null, process: null })
    setNotes('')
  }, [])

  return {
    activeStep,
    addFiles,
    allFilesConfigured,
    applyBulkSelections,
    bulkSelection,
    canMoveForward,
    completedQuote,
    contactEmail,
    emailHasError,
    emailIsValid,
    error,
    files,
    filePreferences,
    goToStep,
    handleBulkSelectionChange,
    isSubmitting,
    normalizedEmail,
    notes,
    removeFile,
    resetWizard,
    setCompletedQuote,
    setContactEmail,
    setError,
    setIsSubmitting,
    setNotes,
    updateFilePreference,
  }
}

export type {
  BulkPreference,
  CompletedQuote,
  CompletedQuoteItem,
  FilePreference,
  SelectedFile,
} from '@/lib/quotes/types'
