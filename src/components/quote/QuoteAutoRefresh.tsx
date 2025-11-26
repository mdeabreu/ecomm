'use client'

import { QuoteReadinessPoller } from '@/components/quote/QuoteReadinessPoller'
import { useRouter } from 'next/navigation'
import React from 'react'

type QuoteAutoRefreshProps = {
  className?: string
  email?: string | null
  quoteId: string | number
  shouldPoll?: boolean
}

export const QuoteAutoRefresh: React.FC<QuoteAutoRefreshProps> = ({
  className,
  email,
  quoteId,
  shouldPoll = true,
}) => {
  const router = useRouter()

  return (
    <QuoteReadinessPoller
      email={email}
      onReady={() => router.refresh()}
      quoteId={quoteId}
      shouldPoll={shouldPoll}
    >
      <p className={className}>
        Waiting for slicing to finish… this page will refresh automatically once weight and duration
        are ready.
      </p>
    </QuoteReadinessPoller>
  )
}
