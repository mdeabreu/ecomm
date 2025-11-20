'use client'

import { checkQuoteReadiness } from '@/lib/quotes/actions/checkQuoteReadiness'
import React, { useEffect, useRef } from 'react'

type QuoteReadinessPollerProps = {
  children?: React.ReactNode
  email?: string | null
  onReady: () => void
  pollIntervalMs?: number
  quoteId: string
  /**
   * Skip polling when false; useful when the metrics already exist on initial render.
   */
  shouldPoll?: boolean
}

export const QuoteReadinessPoller: React.FC<QuoteReadinessPollerProps> = ({
  children = null,
  email,
  onReady,
  pollIntervalMs = 8000,
  quoteId,
  shouldPoll = true,
}) => {
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (!quoteId || !shouldPoll) {
      return
    }

    let cancelled = false

    const checkStatus = async () => {
      if (cancelled || triggeredRef.current) return

      try {
        const payload = await checkQuoteReadiness({ quoteId, email })
        if (payload?.ready) {
          triggeredRef.current = true
          onReady()
        }
      } catch {
        // Swallow errors; next tick will try again.
      }
    }

    const timer = setInterval(checkStatus, pollIntervalMs)
    checkStatus()

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [email, onReady, pollIntervalMs, quoteId, shouldPoll])

  return <>{children}</>
}
