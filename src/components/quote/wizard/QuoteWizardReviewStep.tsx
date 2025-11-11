import { useQuoteWizardContext } from '@/components/quote/QuoteWizardContext'
import { QuoteSummaryCard } from '@/components/quote/wizard/QuoteSummaryCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/cn'
import React from 'react'

export const QuoteWizardReviewStep: React.FC = () => {
  const {
    colourMap,
    contactEmail,
    emailHasError,
    emailIsValid,
    files,
    getPreferenceForFile,
    materialMap,
    notes,
    processMap,
    requiresEmail,
    setContactEmail,
    setNotes,
  } = useQuoteWizardContext()
  return (
    <section className="space-y-4">
      <QuoteSummaryCard
        description="Double-check each model and its selections before submitting."
        items={files.map((item) => {
          const prefs = getPreferenceForFile(item.id)
          const materialName = prefs.material
            ? materialMap.get(prefs.material)?.name ?? 'Pending assignment'
            : 'Pending assignment'
          const colourEntry = prefs.colour ? colourMap.get(prefs.colour) : null
          const colourName = colourEntry?.name ?? 'Pending assignment'
          const colourSwatches = colourEntry?.swatches ?? []
          const processName = prefs.process
            ? processMap.get(prefs.process)?.name ?? 'Pending assignment'
            : 'Pending assignment'

          return {
            attributes: [
              { label: 'Material', value: materialName },
              {
                label: 'Colour',
                value: (
                  <div className="flex flex-col gap-2">
                    <span>{colourName}</span>
                    {colourSwatches.length ? (
                      <div className="flex gap-1">
                        {colourSwatches.map((swatch) => (
                          <span
                            aria-label={swatch}
                            className="inline-flex h-4 w-4 rounded-full border"
                            key={`${item.id}-${swatch}`}
                            style={{ backgroundColor: swatch }}
                            title={swatch}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              { label: 'Process', value: processName },
              { label: 'Quantity', value: prefs.quantity },
            ],
            key: item.id,
            name: item.file.name,
            size: item.file.size,
            variant: 'muted' as const,
          }
        })}
        title="Models & preferences"
      />

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
          {emailHasError ? <p className="text-xs text-destructive">Enter a valid email address.</p> : null}
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
  )
}
