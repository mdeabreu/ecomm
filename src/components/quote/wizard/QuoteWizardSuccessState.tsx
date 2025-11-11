import type { CompletedQuote } from '@/lib/quotes/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { QuoteSummaryCard } from '@/components/quote/wizard/QuoteSummaryCard'
import Link from 'next/link'
import React from 'react'

type QuoteWizardSuccessStateProps = {
  completedQuote: CompletedQuote
  isAuthenticated: boolean
  onStartAnother: () => void
}

export const QuoteWizardSuccessState: React.FC<QuoteWizardSuccessStateProps> = ({
  completedQuote,
  isAuthenticated,
  onStartAnother,
}) => {
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
              <span className="font-medium text-foreground">{completedQuote.email}</span>. Use this email if
              you need to look up your quote later.
            </p>
          </div>
        ) : null}

        <QuoteSummaryCard
          items={completedQuote.items.map((item) => ({
            attributes: [
              { label: 'Material', value: item.materialName },
              {
                label: 'Colour',
                value: (
                  <div className="flex flex-col gap-2">
                    <span>{item.colourName}</span>
                    {item.colourSwatches?.length ? (
                      <div className="flex gap-1">
                        {item.colourSwatches.map((swatch) => (
                          <span
                            aria-label={swatch}
                            className="inline-flex h-4 w-4 rounded-full border"
                            key={`${item.modelName}-${swatch}`}
                            style={{ backgroundColor: swatch }}
                            title={swatch}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              { label: 'Process', value: item.processName },
              { label: 'Quantity', value: item.quantity },
            ],
            key: `${item.modelName}-${item.size}-${item.materialName}`,
            name: item.modelName,
            size: item.size,
          }))}
          notes={completedQuote.notes}
          title="Models & selections"
        />
      </CardContent>
      <CardFooter className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {isAuthenticated
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
          <Button onClick={onStartAnother} variant="default">
            Start another quote
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
