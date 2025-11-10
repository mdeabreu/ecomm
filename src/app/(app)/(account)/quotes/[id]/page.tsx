import type { Colour, Material, Model, Process, Quote } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { QuoteStatus as QuoteStatusBadge } from '@/components/QuoteStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/utilities/formatDateTime'
import configPromise from '@payload-config'
import { ChevronLeftIcon, FileIcon, HashIcon, PaletteIcon, RulerIcon } from 'lucide-react'
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

const formatFileSize = (size?: number | null) => {
  if (typeof size !== 'number' || Number.isNaN(size) || size <= 0) return null

  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let value = size

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
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

        {quote.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional details provided with this request.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{quote.notes}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Requested items</CardTitle>
            <CardDescription>Each uploaded model and the preferences attached to it.</CardDescription>
          </CardHeader>
          <CardContent>
            {items.length ? (
              <ul className="space-y-6">
                {items.map((item, index) => {
                  const modelFilename =
                    item.model?.originalFilename ??
                    item.model?.filename ??
                    (item.model?.id ? `Model ${item.model.id}` : `Item ${index + 1}`)
                  const readableSize = formatFileSize(item.model?.filesize)
                  const uploadedAt = item.model?.createdAt
                  const colourSwatches = Array.isArray(item.colour?.swatches)
                    ? item.colour?.swatches
                    : []

                  return (
                    <li
                      className="space-y-4 rounded-lg border bg-muted/20 p-4"
                      key={item.key}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <FileIcon className="size-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{modelFilename}</p>
                            {uploadedAt ? (
                              <p className="text-xs text-muted-foreground">
                                Uploaded{' '}
                                <time dateTime={uploadedAt}>
                                  {formatDateTime({ date: uploadedAt, format: 'MMMM dd, yyyy' })}
                                </time>
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:text-right">
                          {readableSize ? (
                            <span className="text-sm text-muted-foreground">{readableSize}</span>
                          ) : null}
                          {item.model?.url ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={item.model.url}>Download</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <dl className="grid gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-lg border bg-background/60 p-3">
                          <dt className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <RulerIcon className="size-4" />
                            Material
                          </dt>
                          <dd className="font-medium">{item.material?.name ?? 'Pending assignment'}</dd>
                        </div>
                        <div className="rounded-lg border bg-background/60 p-3">
                          <dt className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <PaletteIcon className="size-4" />
                            Colour
                          </dt>
                          <dd className="font-medium">{item.colour?.name ?? 'Pending assignment'}</dd>
                          {colourSwatches && colourSwatches.length ? (
                            <div className="mt-3 flex gap-2">
                              {colourSwatches.map((swatch) => {
                                const value =
                                  typeof swatch === 'object' && swatch && 'hexcode' in swatch
                                    ? (swatch as { hexcode?: string }).hexcode
                                    : typeof swatch === 'string'
                                      ? swatch
                                      : null

                                if (!value) return null

                                return (
                                  <span
                                    key={`${item.key}-${value}`}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                                    style={{ backgroundColor: value }}
                                    title={value}
                                  />
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                        <div className="rounded-lg border bg-background/60 p-3">
                          <dt className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <RulerIcon className="size-4" />
                            Process
                          </dt>
                          <dd className="font-medium">{item.process?.name ?? 'Pending assignment'}</dd>
                        </div>
                        <div className="rounded-lg border bg-background/60 p-3">
                          <dt className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <HashIcon className="size-4" />
                            Quantity
                          </dt>
                          <dd className="font-medium">{item.quantity}</dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
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
