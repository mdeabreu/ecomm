'use client'

import { Message } from '@/components/Message'
import { useQuoteWizardState } from '@/components/quote/hooks/useQuoteWizardState'
import { QuoteWizardContext } from '@/components/quote/QuoteWizardContext'
import { QuoteWizardPreferenceStep } from '@/components/quote/wizard/QuoteWizardPreferenceStep'
import { QuoteWizardReviewStep } from '@/components/quote/wizard/QuoteWizardReviewStep'
import { QuoteWizardStepper } from '@/components/quote/wizard/QuoteWizardStepper'
import { QuoteWizardSuccessState } from '@/components/quote/wizard/QuoteWizardSuccessState'
import { QuoteWizardUploadStep } from '@/components/quote/wizard/QuoteWizardUploadStep'
import { QuoteWizardNavigation } from '@/components/quote/wizard/QuoteWizardNavigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  ColourOption,
  FilePreference,
  FilamentCombination,
  MaterialOption,
  ProcessOption,
  QuoteItemInput,
} from '@/lib/quotes/types'
import { buildCompletedQuoteSummary } from '@/lib/quotes/summary'
import { normalizeId } from '@/lib/quotes/utils'
import { useAuth } from '@/providers/Auth'
import React, { ChangeEvent, useCallback, useMemo, useRef } from 'react'

type QuoteWizardProps = {
  colours: ColourOption[]
  combinations: FilamentCombination[]
  materials: MaterialOption[]
  processes: ProcessOption[]
}

const steps = [
  {
    description: 'Upload at least one STL file. OBJ is also supported.',
    title: 'Upload models',
  },
  {
    description: 'Pick the material, colour, process, and quantity for each model.',
    title: 'Choose preferences',
  },
  {
    description: 'Confirm everything looks good before submitting your request.',
    title: 'Review & submit',
  },
] as const

export const QuoteWizard: React.FC<QuoteWizardProps> = ({
  colours,
  combinations,
  materials,
  processes,
}) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const requiresEmail = !user

  const {
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
  } = useQuoteWizardState({
    initialEmail: user?.email,
    requiresEmail,
    totalSteps: steps.length,
  })

  const colourMap = useMemo(() => {
    const map = new Map<string, ColourOption>()
    colours.forEach((colour) => {
      map.set(normalizeId(colour.id), colour)
    })
    return map
  }, [colours])

  const materialMap = useMemo(() => {
    const map = new Map<string, MaterialOption>()
    materials.forEach((material) => {
      map.set(normalizeId(material.id), material)
    })
    return map
  }, [materials])

  const processMap = useMemo(() => {
    const map = new Map<string, ProcessOption>()
    processes.forEach((process) => {
      map.set(normalizeId(process.id), process)
    })
    return map
  }, [processes])

  const combinationsByMaterial = useMemo(() => {
    const map = new Map<string, Set<string>>()
    combinations.forEach((combo) => {
      const materialId = normalizeId(combo.materialId)
      const colourId = normalizeId(combo.colourId)
      if (!map.has(materialId)) {
        map.set(materialId, new Set())
      }
      map.get(materialId)!.add(colourId)
    })
    return map
  }, [combinations])

  const getAvailableColoursForMaterial = useCallback(
    (materialId: string | null) => {
      if (!materialId) return []
      const allowed = combinationsByMaterial.get(materialId)
      if (!allowed) return []
      return colours.filter((colour) => allowed.has(normalizeId(colour.id)))
    },
    [colours, combinationsByMaterial],
  )

  const bulkColourOptions = useMemo(
    () => getAvailableColoursForMaterial(bulkSelection.material),
    [bulkSelection.material, getAvailableColoursForMaterial],
  )
  const bulkSelectionReady =
    Boolean(bulkSelection.material && bulkSelection.colour && bulkSelection.process)

  const getPreferenceForFile = useCallback(
    (fileId: string): FilePreference => {
      return filePreferences[fileId] ?? { material: null, colour: null, process: null, quantity: 1 }
    },
    [filePreferences],
  )

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || [])
    if (!nextFiles.length) return
    const addedCount = addFiles(nextFiles)
    if (addedCount && fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleContactEmailChange = useCallback(
    (value: string) => {
      setContactEmail(value)
    },
    [setContactEmail],
  )

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value)
    },
    [setNotes],
  )

  const handleSubmit = async () => {
    if (!files.length) {
      setError('Add models before submitting.')
      return
    }

    if (!allFilesConfigured) {
      setError('Select a material, colour, process, and quantity for each model before submitting.')
      return
    }

    if (requiresEmail && !emailIsValid) {
      setError('Please provide a valid email address so we can reach you about this quote.')
      return
    }

    const submissionEmail =
      user?.email?.toLowerCase() ?? (normalizedEmail ? normalizedEmail.toLowerCase() : undefined)
    const displayEmail = user?.email ?? (normalizedEmail || null)
    const trimmedNotes = notes.trim()

    setIsSubmitting(true)
    setError(null)

    try {
      const uploadedModelIds: Array<string | number> = []

      for (const item of files) {
        const formData = new FormData()
        formData.append('file', item.file)

        const response = await fetch(`/api/models`, {
          body: formData,
          credentials: 'include',
          method: 'POST',
        })

        if (!response.ok) {
          const message = response.statusText || 'Failed to upload one of the models.'
          throw new Error(message)
        }

        const payload = await response.json()
        if (!payload?.doc?.id) {
          throw new Error('We could not confirm the uploaded model. Please try again.')
        }

        uploadedModelIds.push(payload.doc.id)
      }

      const itemsPayload: QuoteItemInput[] = files.map((file, index) => {
        const prefs = filePreferences[file.id]
        if (!prefs?.material || !prefs?.colour || !prefs?.process || !prefs?.quantity) {
          throw new Error('Select a material, colour, process, and quantity for every model.')
        }

        const materialId = Number(prefs.material)
        const colourId = Number(prefs.colour)
        const processId = Number(prefs.process)
        const quantity =
          typeof prefs.quantity === 'number' && Number.isFinite(prefs.quantity)
            ? Math.max(1, Math.floor(prefs.quantity))
            : 1

        if ([materialId, colourId, processId].some((value) => Number.isNaN(value))) {
          throw new Error('Select valid material, colour, and process options before submitting.')
        }

        return {
          colour: colourId,
          material: materialId,
          model: uploadedModelIds[index],
          process: processId,
          quantity,
        }
      })

      const requestBody = {
        items: itemsPayload,
        ...(!user && submissionEmail ? { customerEmail: submissionEmail } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      }

      const quoteResponse = await fetch(`/api/quotes`, {
        body: JSON.stringify(requestBody),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!quoteResponse.ok) {
        const message = quoteResponse.statusText || 'We could not create the quote.'
        throw new Error(message)
      }

      const quotePayload = await quoteResponse.json()
      if (!quotePayload?.doc?.id) {
        throw new Error('The quote was created but we could not confirm its ID.')
      }

      const summaryItems = buildCompletedQuoteSummary({
        colourMap,
        filePreferences,
        files,
        materialMap,
        processMap,
      })

      setCompletedQuote({
        email: displayEmail,
        id: normalizeId(quotePayload.doc.id),
        items: summaryItems,
        notes: trimmedNotes || null,
      })

      resetWizard()
    } catch (submissionError) {
      if (submissionError instanceof Error) {
        setError(submissionError.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const contextValue = useMemo(
    () => ({
      applyBulkSelections,
      bulkColourOptions,
      bulkSelection,
      bulkSelectionReady,
      colourMap,
      contactEmail,
      emailHasError,
      emailIsValid,
      fileInputRef,
      files,
      getAvailableColoursForMaterial,
      getPreferenceForFile,
      handleBulkSelectionChange,
      handleFileChange,
      materials,
      materialMap,
      notes,
      processes,
      processMap,
      removeFile,
      requiresEmail,
      setContactEmail: handleContactEmailChange,
      setNotes: handleNotesChange,
      updateFilePreference,
    }),
    [
      applyBulkSelections,
      bulkColourOptions,
      bulkSelection,
      bulkSelectionReady,
      colourMap,
      contactEmail,
      emailHasError,
      emailIsValid,
      files,
      getAvailableColoursForMaterial,
      getPreferenceForFile,
      handleBulkSelectionChange,
      handleContactEmailChange,
      handleFileChange,
      handleNotesChange,
      materials,
      materialMap,
      notes,
      processes,
      processMap,
      removeFile,
      requiresEmail,
      updateFilePreference,
    ],
  )

  if (completedQuote) {
    return (
      <QuoteWizardSuccessState
        completedQuote={completedQuote}
        isAuthenticated={Boolean(user)}
        onStartAnother={() => setCompletedQuote(null)}
      />
    )
  }

  return (
    <QuoteWizardContext.Provider value={contextValue}>
      <Card>
        <CardHeader>
          <CardTitle>Request a custom quote</CardTitle>
          <CardDescription>
            Upload your models, choose how you want them printed, and we’ll take it from there.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <QuoteWizardStepper activeStep={activeStep} steps={steps} />

          {error ? <Message error={error} /> : null}

          {activeStep === 0 && <QuoteWizardUploadStep />}
          {activeStep === 1 && <QuoteWizardPreferenceStep />}
          {activeStep === 2 && <QuoteWizardReviewStep />}
        </CardContent>

        <CardFooter>
          <QuoteWizardNavigation
            activeStep={activeStep}
            canGoBack={activeStep > 0}
            canMoveForward={canMoveForward}
            emailIsValid={emailIsValid}
            isSubmitting={isSubmitting}
            onBack={() => goToStep(activeStep - 1)}
            onNext={() => goToStep(activeStep + 1)}
            onSubmit={handleSubmit}
            requiresEmail={requiresEmail}
            totalSteps={steps.length}
          />
        </CardFooter>
      </Card>
    </QuoteWizardContext.Provider>
  )
}
