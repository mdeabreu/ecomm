import { beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { initPayloadWithUsers, type PayloadTestSetup } from './helpers/payloadTest'

let payload: Payload
let adminContext: PayloadTestSetup['adminContext']
let customerContext: PayloadTestSetup['customerContext']

beforeAll(async () => {
  const setup = await initPayloadWithUsers()
  payload = setup.payload
  adminContext = setup.adminContext
  customerContext = setup.customerContext
})

describe('Vendors collection', () => {
  it('allows admins to create vendors', async () => {
    const vendor = await payload.create({
      collection: 'vendors',
      data: {
        name: 'Integration Vendor',
        url: 'https://example.com/vendor',
      },
      user: adminContext,
      overrideAccess: false,
    })

    expect(vendor.name).toBe('Integration Vendor')
    expect(vendor.url).toBe('https://example.com/vendor')
  })

  it('blocks non-admin creation', async () => {
    await expect(
      payload.create({
        collection: 'vendors',
        data: {
          name: 'Customer Vendor Attempt',
          url: 'https://example.com/fail',
        },
        user: customerContext,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/not allowed|unauthorized/i)
  })

  it('allows public reads', async () => {
    const vendors = await payload.find({
      collection: 'vendors',
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })

    expect(Array.isArray(vendors.docs)).toBe(true)
  })
})
