import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'

type UserContext = { id: string | number; roles: string[] }

export type PayloadTestSetup = {
  payload: Payload
  adminUser: { id: string | number }
  customerUser: { id: string | number }
  otherCustomer: { id: string | number }
  adminContext: UserContext
  customerContext: UserContext
  otherCustomerContext: UserContext
}

export const initPayloadWithUsers = async (): Promise<PayloadTestSetup> => {
  if (!process.env.DATABASE_URI) {
    const dbPath = path.resolve(
      'data/tmp',
      `payload-int-${Date.now()}-${Math.random().toString(16).slice(2)}.db`,
    )
    await fs.mkdir(path.dirname(dbPath), { recursive: true })
    process.env.DATABASE_URI = `file:${dbPath}`
  }
  process.env.PAYLOAD_SECRET ??= 'payload-int-test-secret'

  const { default: payloadConfig } = await import('@/payload.config')
  const payload = await getPayload({ config: payloadConfig })

  const unique = Date.now()

  const adminUser = await payload.create({
    collection: 'users',
    data: {
      email: `admin+${unique}@example.com`,
      password: 'pass1234',
      name: 'Admin Tester',
      roles: ['admin'],
    },
    overrideAccess: true,
  })

  const customerUser = await payload.create({
    collection: 'users',
    data: {
      email: `customer+${unique}@example.com`,
      password: 'pass1234',
      name: 'Customer Tester',
      roles: ['customer'],
    },
    overrideAccess: true,
  })

  const otherCustomer = await payload.create({
    collection: 'users',
    data: {
      email: `customer-b+${unique}@example.com`,
      password: 'pass1234',
      name: 'Other Customer Tester',
      roles: ['customer'],
    },
    overrideAccess: true,
  })

  return {
    payload,
    adminUser,
    customerUser,
    otherCustomer,
    adminContext: { id: adminUser.id, roles: ['admin'] },
    customerContext: { id: customerUser.id, roles: ['customer'] },
    otherCustomerContext: { id: otherCustomer.id, roles: ['customer'] },
  }
}
