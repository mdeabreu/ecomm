import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'

import { initPayloadWithUsers, type PayloadTestSetup } from './helpers/payloadTest'

const modelFixturePath = path.resolve('src/endpoints/seed/3dbenchy.stl')

const getId = (value: unknown): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    (typeof value.id === 'string' || typeof value.id === 'number')
  ) {
    return value.id
  }
  return undefined
}

let payload: Payload
let adminContext: PayloadTestSetup['adminContext']
let customerContext: PayloadTestSetup['customerContext']
let otherCustomerContext: PayloadTestSetup['otherCustomerContext']
let customerUser: PayloadTestSetup['customerUser']
let otherCustomer: PayloadTestSetup['otherCustomer']

beforeAll(async () => {
  if (!fs.existsSync(modelFixturePath)) {
    throw new Error('Expected STL fixture missing at src/endpoints/seed/3dbenchy.stl')
  }

  const setup = await initPayloadWithUsers()
  payload = setup.payload
  adminContext = setup.adminContext
  customerContext = setup.customerContext
  otherCustomerContext = setup.otherCustomerContext
  customerUser = setup.customerUser
  otherCustomer = setup.otherCustomer
})

describe('Models collection', () => {
  it('sets the customer to the requesting user on upload', async () => {
    const model = await payload.create({
      collection: 'models',
      filePath: modelFixturePath,
      data: {},
      user: customerContext,
      depth: 0,
      overrideAccess: false,
    })

    expect(getId(model.customer)).toBe(customerUser.id)
    expect(model.originalFilename).toBe(path.basename(modelFixturePath))
  })

  it('only lets the owner or admin read a model', async () => {
    const model = await payload.create({
      collection: 'models',
      filePath: modelFixturePath,
      data: {},
      user: customerContext,
      depth: 0,
      overrideAccess: false,
    })

    const otherResult = await payload.find({
      collection: 'models',
      user: otherCustomerContext,
      where: {
        id: {
          equals: model.id,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })

    expect(otherResult.docs.length).toBe(0)

    const adminResult = await payload.findByID({
      collection: 'models',
      id: model.id,
      user: adminContext,
      depth: 0,
      overrideAccess: false,
    })

    expect(adminResult.id).toBe(model.id)
  })
})
