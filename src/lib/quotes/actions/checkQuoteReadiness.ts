'use server'

import type { Quote } from '@/payload-types'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

type CheckQuoteReadinessArgs = {
  email?: string | null
  quoteId: string | number
}

type CheckQuoteReadinessResult = {
  hasDuration: boolean
  hasWeight: boolean
  ok: boolean
  ready: boolean
  status: string | null
  updatedAt: string | null
}

export const checkQuoteReadiness = async ({
  email,
  quoteId,
}: CheckQuoteReadinessArgs): Promise<CheckQuoteReadinessResult> => {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  const normalizedLookupEmail = email?.trim().toLowerCase() ?? ''

  if (!quoteId) {
    return {
      hasDuration: false,
      hasWeight: false,
      ok: false,
      ready: false,
      status: null,
      updatedAt: null,
    }
  }

  let quote: Quote | null = null

  try {
    const quoteResult = await payload.findByID({
      collection: 'quotes',
      id: quoteId,
      depth: 2,
      // Allow lookups without user auth; we'll enforce checks below.
      overrideAccess: !Boolean(user),
      select: {
        items: true,
        status: true,
        updatedAt: true,
        customer: true,
        customerEmail: true,
      },
      user,
    })

    const canAccessAsUser =
      user &&
      quoteResult &&
      quoteResult.customer &&
      (typeof quoteResult.customer === 'object'
        ? quoteResult.customer.id
        : quoteResult.customer) === user.id

    const canAccessAsGuest =
      !user &&
      normalizedLookupEmail &&
      quoteResult &&
      ((typeof quoteResult.customerEmail === 'string' &&
        quoteResult.customerEmail.toLowerCase() === normalizedLookupEmail) ||
        (typeof quoteResult.customer === 'object' &&
          typeof quoteResult.customer?.email === 'string' &&
          quoteResult.customer.email.toLowerCase() === normalizedLookupEmail))

    if (quoteResult && (canAccessAsUser || canAccessAsGuest)) {
      quote = quoteResult as Quote
    }
  } catch (error) {
    console.error('checkQuoteReadiness error', error)
  }

  if (!quote) {
    return {
      hasDuration: false,
      hasWeight: false,
      ok: false,
      ready: false,
      status: null,
      updatedAt: null,
    }
  }

  const items = Array.isArray(quote.items) ? quote.items : []
  const metrics = items.map((item) => ({
    duration: isNumber((item as any)?.duration) ? (item as any).duration : null,
    grams: isNumber((item as any)?.grams) ? (item as any).grams : null,
  }))

  const hasWeight = metrics.some((item) => isNumber(item.grams))
  const hasDuration = metrics.some((item) => isNumber(item.duration))
  const ready =
    metrics.length > 0 && metrics.every((item) => isNumber(item.grams) && isNumber(item.duration))

  return {
    hasDuration,
    hasWeight,
    ok: true,
    ready,
    status: quote.status ?? null,
    updatedAt: quote.updatedAt ?? null,
  }
}
