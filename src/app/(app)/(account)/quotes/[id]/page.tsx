import type { Colour, Material, Model, Process, Quote } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { QuoteStatus as QuoteStatusBadge } from '@/components/QuoteStatus'
import { QuoteSummaryCard } from '@/components/quote/wizard/QuoteSummaryCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { extractSwatches } from '@/lib/quotes/utils'
import { formatDateTime } from '@/utilities/formatDateTime'
import configPromise from '@payload-config'
import { ChevronLeftIcon } from 'lucide-react'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{email?: string}>
}

const statusCopy: Record<
  Quote['status'],
  {
    description: string
    label: string
  }
> = {
  approved: {
    description: 'Your quote has been approved—expect production to begin shortly.',
    label: 'Approved',
  },
  new: {
    description: 'We received your request and will review it soon.',
    label: 'New',
  },
  quoted: {
    description: 'A price has been generated and is ready for your review.',
    label: 'Quoted',
  },
  rejected: {
    description: 'This request was rejected. Reach out if you have questions.',
    label: 'Rejected',
  },
  reviewing: {
    description: 'Our team is reviewing the models and selected options.',
    label: 'Reviewing',
  },
}

type QuoteItemDetail = {
  colour: Colour | null
  key: string
  material: Material | null
  model: Model | null
  process: Process | null
  quantity: number
}

export default async function Quote({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '' } = await searchParams
  const normalizedLookupEmailOuter = email?.trim().toLowerCase() ?? ''

  let quote: Quote | null = null

  try {
    const matchingCustomerIds =
      !user && normalizedLookupEmailOuter
        ? (
            await payload.find({
              collection: 'users',
              pagination: false,
              limit: 25,
              where: {
                email: {
                  equals: normalizedLookupEmailOuter,
                },
              },
              select: {
                id: true,
              },
            })
          ).docs
            ?.map((doc) => (typeof doc === 'object' && doc !== null ? doc.id : doc))
            .filter(Boolean)
        : []

    const whereClauses: any[] = [
      {
        id: {
          equals: id,
        },
      },
    ]

    if (user) {
      whereClauses.push({
        customer: {
          equals: user.id,
        },
      })
    } else if (normalizedLookupEmailOuter) {
      const orFilters: any[] = [
        {
          customerEmail: {
            equals: normalizedLookupEmailOuter,
          },
        },
      ]

      if (matchingCustomerIds.length) {
        orFilters.push({
          customer: {
            in: matchingCustomerIds,
          },
        })
      }

      whereClauses.push({
        or: orFilters,
      })
    }

    const {
      docs: [quoteResult],
    } = await payload.find({
      collection: 'quotes',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: whereClauses,
      },
      select: {
        amount: true,
        status: true,
        customer: true,
        customerEmail: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        items: true,
        notes: true,
      },
    })

    const normalizedLookupEmail = normalizedLookupEmailOuter

    const canAccessAsGuest =
      !user &&
      normalizedLookupEmail &&
      quoteResult &&
      ((typeof quoteResult.customerEmail === 'string' &&
        quoteResult.customerEmail.toLowerCase() === normalizedLookupEmail) ||
        (typeof quoteResult.customer === 'object' &&
          typeof quoteResult.customer?.email === 'string' &&
          quoteResult.customer.email.toLowerCase() === normalizedLookupEmail))

    const canAccessAsUser =
      user &&
      quoteResult &&
      quoteResult.customer &&
      (typeof quoteResult.customer === 'object'
        ? quoteResult.customer.id
        : quoteResult.customer) === user.id

    if (quoteResult && (canAccessAsGuest || canAccessAsUser)) {
      quote = quoteResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!quote) {
    notFound()
  }

  const items = (quote.items || [])
    .map((item, index): QuoteItemDetail | null => {
      if (!item || typeof item !== 'object') return null

      const material = (typeof item.material === 'object' ? item.material : null) as Material | null
      const colour = (typeof item.colour === 'object' ? item.colour : null) as Colour | null
      const process = (typeof item.process === 'object' ? item.process : null) as Process | null
      const model = (typeof item.model === 'object' ? item.model : null) as Model | null
      const quantity =
        typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0
          ? Math.floor(item.quantity)
          : 1

      const keyCandidate =
        typeof item.id === 'string' || typeof item.id === 'number'
          ? String(item.id)
          : `${quote.id}-${index}`

      return {
        colour,
        key: keyCandidate,
        material,
        model,
        process,
        quantity,
      }
    })
    .filter((item): item is QuoteItemDetail => item !== null)

  const summaryItems = items.map((item, index) => {
    const modelFilename =
      item.model?.originalFilename ??
      item.model?.filename ??
      (item.model?.id ? `Model ${item.model.id}` : `Item ${index + 1}`)
    const fileSize =
      typeof item.model?.filesize === 'number' && item.model.filesize > 0
        ? item.model.filesize
        : undefined
    const uploadedAt = item.model?.createdAt
    const colourSwatches = extractSwatches(item.colour?.swatches ?? [])

    return {
      attributes: [
        { label: 'Material', value: item.material?.name ?? 'Pending assignment' },
        {
          label: 'Colour',
          value: (
            <div className="flex flex-col gap-2">
              <span>{item.colour?.name ?? 'Pending assignment'}</span>
              {colourSwatches.length ? (
                <div className="flex gap-1">
                  {colourSwatches.map((swatch) => (
                    <span
                      aria-label={swatch}
                      className="inline-flex h-4 w-4 rounded-full border"
                      key={`${item.key}-${swatch}`}
                      style={{ backgroundColor: swatch }}
                      title={swatch}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ),
        },
        { label: 'Process', value: item.process?.name ?? 'Pending assignment' },
        { label: 'Quantity', value: item.quantity },
      ],
      key: item.key,
      name: modelFilename,
      size: fileSize,
    }
  })

  const statusDetails = statusCopy[quote.status] ?? statusCopy.new
  const lookupEmail = normalizedLookupEmailOuter
  const viewerEmail =
    lookupEmail || (typeof quote.customerEmail === 'string' ? quote.customerEmail : '')

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {user ? (
            <Button asChild variant="ghost">
              <Link href="/quotes">
                <ChevronLeftIcon />
                All quotes
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/find-quote">
                <ChevronLeftIcon />
                Find quote
              </Link>
            </Button>
          )}

          <h1 className="text-sm uppercase font-mono px-2 bg-primary/10 rounded tracking-[0.07em] w-fit self-end sm:self-auto">
            {`Quote #${quote.id}`}
          </h1>
        </div>

        <div className="bg-card border rounded-lg px-6 py-4 flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div>
              <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Requested</p>
              <p className="text-lg">
                <time dateTime={quote.createdAt}>
                  {formatDateTime({ date: quote.createdAt, format: 'MMMM dd, yyyy' })}
                </time>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated{' '}
                <time dateTime={quote.updatedAt}>
                  {formatDateTime({ date: quote.updatedAt, format: 'MMMM dd, yyyy' })}
                </time>
              </p>
            </div>

            <div>
              <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Estimated total</p>
              {typeof quote.amount === 'number' ? (
                <Price
                  className="text-lg"
                  amount={quote.amount}
                  currencyCode={quote.currency ?? undefined}
                />
              ) : (
                <span className="text-sm text-muted-foreground">In progress</span>
              )}
            </div>

            {quote.status ? (
              <div className="max-w-sm">
                <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Status</p>
                <QuoteStatusBadge className="mb-2" status={quote.status} />
                <p className="text-sm text-muted-foreground">{statusDetails.description}</p>
              </div>
            ) : null}
          </div>

          {!user && viewerEmail ? (
            <div className="rounded-md bg-muted/20 p-4 text-sm text-muted-foreground">
              Viewing as{' '}
              <span className="font-medium text-foreground">{viewerEmail}</span>. Keep this email
              handy to check on your quote or follow up with our team.
            </div>
          ) : null}
        </div>

        <Card>
          <CardContent className="pt-6">
            {summaryItems.length ? (
              <QuoteSummaryCard
                description="Each uploaded model and the preferences attached to it."
                items={summaryItems}
                notes={quote.notes ?? undefined}
                title="Requested items"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                We did not receive any model files with this quote.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Status and details for quote ${id}.`,
    openGraph: {
      title: `Quote ${id}`,
      url: `/quotes/${id}`,
    },
    title: `Quote ${id}`,
  }
}
