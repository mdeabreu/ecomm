'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import { UploadCloudIcon, XCircleIcon } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type MaterialOption = {
  id: string
  name: string
}

type ColourOption = {
  id: string
  name: string
  finish: string | null
  type: string | null
  swatches: string[]
}

type ProcessOption = {
  id: string
  name: string
}

type FilamentCombination = {
  materialId: string
  colourId: string
}

type QuoteWizardProps = {
  colours: ColourOption[]
  combinations: FilamentCombination[]
  materials: MaterialOption[]
  processes: ProcessOption[]
}

type SelectedFile = {
  file: File
  id: string
}

type FilePreference = {
  material: string | null
  colour: string | null
  process: string | null
  quantity: number
}

type BulkPreference = Omit<FilePreference, 'quantity'>

type CompletedQuoteItem = {
  modelName: string
  size: number
  materialName: string
  colourName: string
  processName: string
  colourSwatches: string[]
  quantity: number
}

type CompletedQuote = {
  email?: string | null
  id: string
  items: CompletedQuoteItem[]
  notes?: string | null
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const normalizeId = (value: string | number) => String(value)

export const QuoteWizard: React.FC<QuoteWizardProps> = ({
  colours,
  combinations,
  materials,
  processes,
}) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [files, setFiles] = useState<SelectedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedQuote, setCompletedQuote] = useState<CompletedQuote | null>(null)
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')
  const [filePreferences, setFilePreferences] = useState<Record<string, FilePreference>>({})
  const [bulkSelection, setBulkSelection] = useState<BulkPreference>({
    material: null,
    colour: null,
    process: null,
  })
  const [notes, setNotes] = useState('')

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

  const updateFilePreference = useCallback(
    (fileId: string, updates: Partial<FilePreference>) => {
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
    },
    [],
  )

  const handleBulkSelectionChange = (field: keyof BulkPreference, value: string | null) => {
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
  }

  const applyBulkSelections = () => {
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
  }

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email)
    }
  }, [user?.email])

  const requiresEmail = !user
  const normalizedEmail = contactEmail.trim()
  const emailIsValid = !requiresEmail || (normalizedEmail.length > 0 && EMAIL_REGEX.test(normalizedEmail))
  const emailHasError = requiresEmail && contactEmail.length > 0 && !EMAIL_REGEX.test(normalizedEmail)

  const resetWizard = () => {
    setActiveStep(0)
    setFiles([])
    setError(null)
    setIsSubmitting(false)
    setFilePreferences({})
    setBulkSelection({ material: null, colour: null, process: null })
    setNotes('')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || [])
    if (!nextFiles.length) return

    const additions: SelectedFile[] = []
    setFiles((prev) => {
      const existingFingerprints = new Set(prev.map((item) => `${item.file.name}-${item.file.size}`))

      nextFiles.forEach((file) => {
        const fingerprint = `${file.name}-${file.size}`
        if (existingFingerprints.has(fingerprint)) return
        additions.push({
          file,
          id: crypto.randomUUID(),
        })
      })

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

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    setFilePreferences((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const goToStep = (nextStep: number) => {
    setActiveStep((current) => {
      if (nextStep < 0) return 0
      if (nextStep >= steps.length) return steps.length - 1
      return nextStep
    })
    setError(null)
  }

  const allFilesConfigured =
    files.length > 0 &&
    files.every((file) => {
      const prefs = filePreferences[file.id]
      if (!prefs) return false
      return Boolean(prefs.material && prefs.colour && prefs.process && prefs.quantity > 0)
    })

  const canMoveForward = (activeStep === 0 && files.length > 0) || (activeStep === 1 && allFilesConfigured)

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

      const itemsPayload = files.map((file, index) => {
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

      const summaryItems: CompletedQuoteItem[] = files.map((file) => {
        const prefs = filePreferences[file.id]
        const materialName = prefs?.material
          ? materialMap.get(prefs.material)?.name ?? 'Selected material'
          : 'Selected material'
        const colourDetails = prefs?.colour ? colourMap.get(prefs.colour) : null
        const processName = prefs?.process
          ? processMap.get(prefs.process)?.name ?? 'Selected process'
          : 'Selected process'
        const quantity =
          typeof prefs?.quantity === 'number' && Number.isFinite(prefs.quantity)
            ? Math.max(1, Math.floor(prefs.quantity))
            : 1

        return {
          colourName: colourDetails?.name ?? 'Selected colour',
          colourSwatches: colourDetails?.swatches || [],
          materialName,
          modelName: file.file.name,
          processName,
          quantity,
          size: file.file.size,
        }
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

  if (completedQuote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your quote request is on its way!</CardTitle>
          <CardDescription>
            {`We've received your models and selections. Our team will review everything and follow up with the next steps soon. Keep the email you provided handy—you can use it to look up this quote any time.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Reference</h3>
            <p className="text-sm text-muted-foreground">Quote ID: {completedQuote.id}</p>
          </div>

          {completedQuote.email ? (
            <div>
              <h3 className="font-semibold">Updates</h3>
              <p className="text-sm text-muted-foreground">
                We’ll send status updates to{' '}
                <span className="font-medium text-foreground">{completedQuote.email}</span>. Use this
                email if you need to look up your quote later.
              </p>
            </div>
          ) : null}

          <div>
            <h3 className="font-semibold">Models & selections</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {completedQuote.items.map((item) => (
                <li
                  className="space-y-3 rounded-md border bg-muted/20 px-3 py-2"
                  key={`${item.modelName}-${item.size}-${item.materialName}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.modelName}</span>
                    <span className="ml-3 shrink-0 text-muted-foreground">{formatFileSize(item.size)}</span>
                  </div>
                  <dl className="grid gap-2 text-xs md:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">Material</dt>
                      <dd className="font-medium">{item.materialName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Colour</dt>
                      <dd className="font-medium">{item.colourName}</dd>
                      {item.colourSwatches?.length ? (
                        <div className="mt-2 flex gap-1">
                          {item.colourSwatches.map((swatch) => (
                            <span
                              aria-label={swatch}
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full border"
                              key={`${item.modelName}-${swatch}`}
                              style={{ backgroundColor: swatch }}
                              title={swatch}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Process</dt>
                      <dd className="font-medium">{item.processName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="font-medium">{item.quantity}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>

          {completedQuote.notes ? (
            <div>
              <h3 className="font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {completedQuote.notes}
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {user
              ? 'You can review this request from your account once it is processed.'
              : 'Use the email above (and this ID if needed) to look up your quote or follow up with our team.'}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link
                href={
                  completedQuote.email
                    ? `/quotes/${completedQuote.id}?email=${encodeURIComponent(completedQuote.email)}`
                    : `/quotes/${completedQuote.id}`
                }
              >
                View quote status
              </Link>
            </Button>
            <Button onClick={() => setCompletedQuote(null)} variant="default">
              Start another quote
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a custom quote</CardTitle>
        <CardDescription>
          Upload your models, choose how you want them printed, and we’ll take it from there.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ol className="flex flex-col gap-4 md:flex-row md:gap-6">
          {steps.map((step, index) => {
            const isActive = index === activeStep
            const isComplete = index < activeStep
            const state = isActive ? 'active' : isComplete ? 'complete' : 'pending'

            return (
              <li
                className={cn(
                  'flex flex-1 items-start gap-3 rounded-lg border px-4 py-3 text-sm transition',
                  {
                    'border-primary/40 bg-primary/5 text-primary': state === 'active',
                    'border-muted-foreground/30 bg-muted/10': state === 'complete',
                    'text-muted-foreground': state === 'pending',
                  },
                )}
                key={step.title}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    {
                      'border-primary bg-primary text-primary-foreground': state === 'active',
                      'border-muted-foreground/20 bg-muted text-muted-foreground': state !== 'active',
                    },
                  )}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </li>
            )
          })}
        </ol>

        {error ? <Message error={error} /> : null}

        {activeStep === 0 && (
          <section className="space-y-4">
            <Label htmlFor="model-upload">Upload STL files</Label>
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center transition hover:border-primary/60 hover:bg-primary/5"
              htmlFor="model-upload"
            >
              <UploadCloudIcon className="size-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Drag & drop your files or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  Supports .stl and .obj up to 200MB each
                </p>
              </div>
              <Input
                accept=".stl,.obj"
                className="hidden"
                id="model-upload"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </label>

            {files.length ? (
              <ul className="space-y-3">
                {files.map((item) => (
                  <li
                    className="flex items-center justify-between rounded-md border bg-background px-4 py-3 text-sm shadow-sm"
                    key={item.id}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>
                    <button
                      aria-label={`Remove ${item.file.name}`}
                      className="text-muted-foreground transition hover:text-destructive"
                      onClick={() => removeFile(item.id)}
                      type="button"
                    >
                      <XCircleIcon aria-hidden="true" className="size-5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add the model files you would like us to quote. You can remove them before
                continuing.
              </p>
            )}
          </section>
        )}

        {activeStep === 1 && (
          <section className="space-y-4">
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Upload at least one model before selecting preferences.
              </p>
            ) : (
              <>
                {files.length > 1 && (
                  <div className="space-y-4 rounded-xl border border-dashed border-muted-foreground/40 bg-background p-6 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">Bulk preferences</p>
                        <p className="text-xs text-muted-foreground">
                          Choose a material, colour, and process once, then apply them to every model.
                          You can still customize individual files afterward.
                        </p>
                      </div>
                      <Button
                        disabled={!bulkSelectionReady}
                        onClick={applyBulkSelections}
                        type="button"
                        variant="outline"
                      >
                        Apply to all models
                      </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select
                        onValueChange={(value) => handleBulkSelectionChange('material', value)}
                        value={bulkSelection.material ?? undefined}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={normalizeId(material.id)}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Colour</Label>
                      <Select
                        disabled={!bulkSelection.material || !bulkColourOptions.length}
                        onValueChange={(value) => handleBulkSelectionChange('colour', value)}
                        value={bulkSelection.colour ?? undefined}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              bulkSelection.material
                                ? bulkColourOptions.length
                                  ? 'Select colour'
                                  : 'No colours available'
                                : 'Select material first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {bulkColourOptions.map((colour) => (
                            <SelectItem key={colour.id} value={normalizeId(colour.id)}>
                              <span className="flex items-center gap-3">
                                <span
                                  aria-hidden="true"
                                  className="inline-flex h-5 w-5 rounded-full border"
                                  style={{
                                    backgroundColor: colour.swatches?.[0] ?? '#f1f5f9',
                                  }}
                                />
                                <span>
                                  <span className="block font-medium">{colour.name}</span>
                                  <span className="block text-xs text-muted-foreground">
                                    {[colour.finish, colour.type].filter(Boolean).join(' • ')}
                                  </span>
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Process</Label>
                      <Select
                        onValueChange={(value) => handleBulkSelectionChange('process', value)}
                        value={bulkSelection.process ?? undefined}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select process" />
                        </SelectTrigger>
                        <SelectContent>
                          {processes.map((process) => (
                            <SelectItem key={process.id} value={normalizeId(process.id)}>
                              {process.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                )}

                {files.map((item) => {
                  const prefs = getPreferenceForFile(item.id)
                  const materialOptions = materials
                  const colourOptions = getAvailableColoursForMaterial(prefs.material)
                  const quantityInputId = `quantity-${item.id}`

                  return (
                  <div key={item.id} className="space-y-4 rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Material</Label>
                        <Select
                          onValueChange={(value) => updateFilePreference(item.id, { material: value })}
                          value={prefs.material ?? undefined}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materialOptions.map((material) => (
                              <SelectItem key={material.id} value={normalizeId(material.id)}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Colour</Label>
                        <Select
                          disabled={!prefs.material || !colourOptions.length}
                          onValueChange={(value) => updateFilePreference(item.id, { colour: value })}
                          value={prefs.colour ?? undefined}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                prefs.material
                                  ? colourOptions.length
                                    ? 'Select colour'
                                    : 'No colours available'
                                  : 'Select material first'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {colourOptions.map((colour) => (
                              <SelectItem key={colour.id} value={normalizeId(colour.id)}>
                                <span className="flex items-center gap-3">
                                  <span
                                    aria-hidden="true"
                                    className="inline-flex h-5 w-5 rounded-full border"
                                    style={{
                                      backgroundColor: colour.swatches?.[0] ?? '#f1f5f9',
                                    }}
                                  />
                                  <span>
                                    <span className="block font-medium">{colour.name}</span>
                                    <span className="block text-xs text-muted-foreground">
                                      {[colour.finish, colour.type].filter(Boolean).join(' • ')}
                                    </span>
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Process</Label>
                        <Select
                          onValueChange={(value) => updateFilePreference(item.id, { process: value })}
                          value={prefs.process ?? undefined}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select process" />
                          </SelectTrigger>
                          <SelectContent>
                            {processes.map((process) => (
                              <SelectItem key={process.id} value={normalizeId(process.id)}>
                                {process.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={quantityInputId}>Quantity</Label>
                        <Input
                          id={quantityInputId}
                          inputMode="numeric"
                          className="bg-transparent"
                          min={1}
                          onChange={(event) =>
                            updateFilePreference(item.id, {
                              quantity: Number.isNaN(event.target.valueAsNumber)
                                ? 1
                                : event.target.valueAsNumber,
                            })
                          }
                          step={1}
                          type="number"
                          value={prefs.quantity ?? 1}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              </>
            )}
          </section>
        )}

        {activeStep === 2 && (
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Models & preferences
              </h3>
              <ul className="mt-2 space-y-3 text-sm">
                {files.map((item) => {
                  const prefs = getPreferenceForFile(item.id)
                  const materialName = prefs.material
                    ? materialMap.get(prefs.material)?.name ?? 'Pending assignment'
                    : 'Pending assignment'
                  const colourName = prefs.colour
                    ? colourMap.get(prefs.colour)?.name ?? 'Pending assignment'
                    : 'Pending assignment'
                  const processName = prefs.process
                    ? processMap.get(prefs.process)?.name ?? 'Pending assignment'
                    : 'Pending assignment'

                  return (
                    <li
                      className="space-y-3 rounded-md border bg-muted/20 px-3 py-2"
                      key={item.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.file.name}</span>
                        <span className="ml-3 shrink-0 text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </span>
                      </div>
                      <dl className="grid gap-2 text-xs md:grid-cols-4">
                        <div>
                          <dt className="text-muted-foreground">Material</dt>
                          <dd className="font-medium">{materialName}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Colour</dt>
                          <dd className="font-medium">{colourName}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Process</dt>
                          <dd className="font-medium">{processName}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Quantity</dt>
                          <dd className="font-medium">{prefs.quantity}</dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            </div>

            {requiresEmail ? (
              <div className="space-y-2">
                <Label htmlFor="quote-email">Contact email</Label>
                <Input
                  aria-invalid={requiresEmail && !emailIsValid}
                  className={cn('w-full', {
                    'border-destructive focus-visible:ring-destructive': emailHasError,
                  })}
                  id="quote-email"
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={contactEmail}
                />
                <p className="text-xs text-muted-foreground">
                  We’ll send updates and lookup instructions to this address.
                </p>
                {emailHasError ? (
                  <p className="text-xs text-destructive">Enter a valid email address.</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="quote-notes">Notes (optional)</Label>
              <Textarea
                id="quote-notes"
                maxLength={2000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Share deadlines, special instructions, or anything else our team should know."
                rows={4}
                value={notes}
              />
              <p className="text-xs text-muted-foreground">
                These notes are shared with our team to help finalize your quote.
              </p>
            </div>
          </section>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Step {activeStep + 1} of {steps.length}
        </div>

        <div className="flex items-center gap-3">
          {activeStep > 0 ? (
            <Button
              disabled={isSubmitting}
              onClick={() => goToStep(activeStep - 1)}
              type="button"
              variant="outline"
            >
              Back
            </Button>
          ) : null}

          {activeStep < steps.length - 1 ? (
            <Button
              disabled={!canMoveForward || isSubmitting}
              onClick={() => goToStep(activeStep + 1)}
              type="button"
            >
              Next
            </Button>
          ) : (
            <Button
              disabled={isSubmitting || (requiresEmail && !emailIsValid)}
              onClick={handleSubmit}
              type="button"
            >
              {isSubmitting ? 'Submitting…' : 'Submit quote'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
