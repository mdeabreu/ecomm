import type { Quote } from '@/payload-types'
import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { QuoteItem } from '@/components/QuoteItem'
import { Button } from '@/components/ui/button'
import configPromise from '@payload-config'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export default async function QuotesPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let quotes: Quote[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your quotes.')}`)
  }

  try {
    const quotesResult = await payload.find({
      collection: 'quotes',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    quotes = quotesResult?.docs || []
  } catch (error) {}

  const hasQuotes = Array.isArray(quotes) && quotes.length > 0

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">Quotes</p>
          <h1 className="text-3xl font-semibold mt-2">Your quote requests</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Track every model review and pricing estimate you&apos;ve submitted.
          </p>
        </div>
        <Button asChild>
          <Link href="/create-quote">Request a quote</Link>
        </Button>
      </div>

      <div className="border rounded-lg bg-primary-foreground w-full">
        {hasQuotes ? (
          <ul className="flex flex-col gap-6 p-6">
            {quotes?.map((quote) => (
              <li key={quote.id}>
                <QuoteItem quote={quote} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p className="text-base text-muted-foreground">
              You haven’t requested a quote yet.
            </p>
            <Button asChild>
              <Link href="/create-quote">Request a quote</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Your quotes.',
  openGraph: mergeOpenGraph({
    title: 'Quotes',
    url: '/quotes',
  }),
  title: 'Quotes',
}
