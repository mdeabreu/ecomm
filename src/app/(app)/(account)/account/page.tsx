import type { Metadata } from 'next'

import { AccountForm } from '@/components/forms/AccountForm'
import { OrderItem } from '@/components/OrderItem'
import { QuoteItem } from '@/components/QuoteItem'
import { Button } from '@/components/ui/button'
import { Order, Quote } from '@/payload-types'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null
  let quotes: Quote[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  try {
    const [ordersResult, quotesResult] = await Promise.all([
      payload.find({
        collection: 'orders',
        limit: 5,
        user,
        overrideAccess: false,
        pagination: false,
        where: {
          customer: {
            equals: user?.id,
          },
        },
      }),
      payload.find({
        collection: 'quotes',
        limit: 5,
        user,
        overrideAccess: false,
        pagination: false,
        where: {
          customer: {
            equals: user?.id,
          },
        },
      }),
    ])

    orders = ordersResult?.docs || []
    quotes = quotesResult?.docs || []
  } catch (error) {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

  return (
    <>
      <div className="border p-8 rounded-lg bg-primary-foreground">
        <h1 className="text-3xl font-medium mb-8">Account settings</h1>
        <AccountForm />
      </div>

      <div className="border p-8 rounded-lg bg-primary-foreground">
        <h2 className="text-3xl font-medium mb-8">Recent Orders</h2>

        <div className="prose dark:prose-invert mb-8">
          <p>
            These are the most recent orders you have placed. Each order is tied to a payment, and
            new purchases will appear here automatically.
          </p>
        </div>

        {(!orders || !Array.isArray(orders) || orders?.length === 0) && (
          <div className="mb-8 flex flex-col gap-3">
            <p className="">You haven’t placed an order yet.</p>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {orders?.map((order, index) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="default">
          <Link href="/orders">View all orders</Link>
        </Button>
      </div>

      <div className="border p-8 rounded-lg bg-primary-foreground">
        <h2 className="text-3xl font-medium mb-8">Recent Quotes</h2>

        <div className="prose dark:prose-invert mb-8">
          <p>
            The latest quote requests you’ve submitted. Each one updates as our team reviews your
            models and pricing preferences.
          </p>
        </div>

        {(!quotes || !Array.isArray(quotes) || quotes?.length === 0) && (
          <div className="mb-8 flex flex-col gap-3">
            <p className="">You haven’t requested a quote yet.</p>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/create-quote">Request a quote</Link>
            </Button>
          </div>
        )}

        {quotes && quotes.length > 0 && (
          <ul className="flex flex-col gap-6 mb-8">
            {quotes?.map((quote, index) => (
              <li key={quote.id}>
                <QuoteItem quote={quote} />
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="default">
          <Link href="/quotes">View all quotes</Link>
        </Button>
      </div>
    </>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
