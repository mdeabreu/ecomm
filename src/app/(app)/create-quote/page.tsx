import type { Metadata } from 'next'

import { QuoteWizard } from '@/components/quote/QuoteWizard'
import { loadQuoteWizardOptions } from '@/lib/quotes/options'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata: Metadata = {
  description:
    'Upload your STL models, choose materials and finishes, and request a custom quote in a few quick steps.',
  openGraph: {
    title: 'Custom quote',
    url: '/quotes',
  },
  title: 'Request a custom quote',
}

export default async function QuotePage() {
  const payload = await getPayload({ config: configPromise })

  const { colourOptions, combinations, materialOptions, processOptions } =
    await loadQuoteWizardOptions(payload)

  return (
    <div className="container py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="prose dark:prose-invert">
          <h1>Custom quote wizard</h1>
          <p>
            Upload your models, select the material, colour, and process you prefer, and we&apos;ll
            review everything before sending a tailored quote. Guests can request a quote too—just
            keep the reference ID handy in case you reach out.
          </p>
        </div>

        <QuoteWizard
          colours={colourOptions}
          combinations={combinations}
          materials={materialOptions}
          processes={processOptions}
        />
      </div>
    </div>
  )
}
