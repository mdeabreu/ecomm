import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { amountField, currencyField } from '@payloadcms/plugin-ecommerce'

import { adminOrCustomerOwner } from '@/access/adminOrCustomerOwner'
import { publicAccess } from '@/access/publicAccess'
import { ecommerceCurrenciesConfig } from '@/config/currencies'

const resolveRelationID = (value: unknown): number | string | undefined => {
  if (value === null || value === undefined) return undefined

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.id === 'string' || typeof record.id === 'number') {
      return record.id
    }

    if (typeof record.value === 'string' || typeof record.value === 'number') {
      return record.value
    }
  }

  return undefined
}

const normalizeQuoteCustomer: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const normalizedEmail =
    typeof data.customerEmail === 'string' ? data.customerEmail.trim().toLowerCase() : undefined

  if (!req.user && normalizedEmail) {
    data.customerEmail = normalizedEmail
  }

  const existingEmail =
    data.customerEmail ??
    (typeof originalDoc?.customerEmail === 'string' ? originalDoc.customerEmail : undefined)

  const existingCustomer =
    resolveRelationID(data.customer) ?? resolveRelationID(originalDoc?.customer)

  if (existingCustomer) {
    data.customer = existingCustomer
  }
  else if (existingEmail) {
    data.customerEmail = existingEmail
  }
  else if (req.user) {
    data.customer = req.user.id
  } else if (!existingCustomer && !existingEmail) {
    throw new Error('Please include a contact email so we can follow up about your quote.')
  }

  return data
}

const resolveQuoteItemsAndAmount: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  let totalAmount = 0

  if (Array.isArray(data.items) && data.items.length > 0) {
    const filamentCache = new Map<string, number | string | null>()
    const materialPriceCache = new Map<string, number | null>()

    let defaultPricePerGram = 0
    try {
      const settings = await req.payload.findGlobal({
        slug: 'settings',
        depth: 0,
      })
      if (settings && typeof settings.pricePerGram === 'number') {
        defaultPricePerGram = settings.pricePerGram
      }
    } catch {
      defaultPricePerGram = 0
    }

    const normalizedItems: typeof data.items = []

    for (const item of data.items) {
      if (!item) {
        normalizedItems.push(item)
        continue
      }

      const material = resolveRelationID(item.material)
      const colour = resolveRelationID(item.colour)

      let filamentID: number | string | null = null

      if (material && colour) {
        const cacheKey = `${material}:${colour}`
        if (filamentCache.has(cacheKey)) {
          filamentID = filamentCache.get(cacheKey) ?? null
        } else {
          const { docs } = await req.payload.find({
            collection: 'filaments',
            limit: 1,
            where: {
              and: [
                {
                  material: {
                    equals: material,
                  },
                },
                {
                  colour: {
                    equals: colour,
                  },
                },
                {
                  active: {
                    equals: true,
                  },
                },
              ],
            },
          })

          filamentID = docs?.[0]?.id ?? null
          filamentCache.set(cacheKey, filamentID)
        }
      }

      const grams = typeof item.grams === 'number' && item.grams > 0 ? item.grams : 0
      const hasOverride = typeof item.priceOverride === 'number'
      let lineAmount = 0

      if (hasOverride) {
        lineAmount = Math.round(Math.max(0, item.priceOverride as number) * 100)
      } else if (grams > 0) {
        let pricePerGram = defaultPricePerGram
        if (material) {
          const materialKey = String(material)

          if (!materialPriceCache.has(materialKey)) {
            let cachedPrice: number | null = null

            if (item.material && typeof item.material === 'object') {
              const maybePrice = (item.material as Record<string, unknown>).pricePerGram
              if (typeof maybePrice === 'number') {
                cachedPrice = maybePrice
              }
            }

            if (cachedPrice === null) {
              try {
                const materialDoc = await req.payload.findByID({
                  collection: 'materials',
                  depth: 0,
                  id: material,
                })
                cachedPrice =
                  typeof materialDoc?.pricePerGram === 'number' ? materialDoc.pricePerGram : null
              } catch {
                cachedPrice = null
              }
            }

            materialPriceCache.set(materialKey, cachedPrice)
          }

          const materialSpecificPrice = materialPriceCache.get(materialKey)
          if (typeof materialSpecificPrice === 'number') {
            pricePerGram = materialSpecificPrice
          }
        }

        if (pricePerGram > 0) {
          lineAmount = Math.round(pricePerGram * grams * 100)
        }
      }

      totalAmount += lineAmount

      normalizedItems.push({
        ...item,
        filament: filamentID,
      })
    }

    data.items = normalizedItems
  }

  data.amount = totalAmount
  if (!data.currency) {
    data.currency = ecommerceCurrenciesConfig.defaultCurrency
  }

  return data
}

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: {
    plural: 'Quotes',
    singular: 'Quote',
  },
  access: {
    create: publicAccess,
    delete: adminOrCustomerOwner,
    read: adminOrCustomerOwner,
    update: adminOrCustomerOwner,
  },
  admin: {
    defaultColumns: ['status', 'amount', 'customerEmail'],
    group: '3D Printing',
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      admin: {
        description: 'Used when the requester is not logged in.',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      interfaceName: 'QuoteStatus',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      admin: {
        position: 'sidebar',
      },
      fields: [
        amountField({
          currenciesConfig: ecommerceCurrenciesConfig,
          overrides: {
            required: false,
          },
        }),
        currencyField({
          currenciesConfig: ecommerceCurrenciesConfig,
          overrides: {
            required: false,
          },
        }),
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Request details',
          fields: [
            {
              name: 'items',
              type: 'array',
              required: true,
              minRows: 1,
              labels: {
                plural: 'Items',
                singular: 'Item',
              },
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'model',
                      type: 'relationship',
                      relationTo: 'models',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                      filterOptions: ({ data }) => {
                        if (data.customer) {
                          return {
                            customer: {
                              equals: data.customer,
                            },
                          }
                        }

                        return true
                      },
                    },
                    {
                      name: 'process',
                      type: 'relationship',
                      relationTo: 'processes',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                      filterOptions: () => {
                        return {
                          active: {
                            equals: true,
                          },
                        }
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'material',
                      type: 'relationship',
                      relationTo: 'materials',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                      filterOptions: ({ siblingData }) => {
                        const colour = resolveRelationID(siblingData?.colour)

                        if (colour) {
                          return {
                            and: [
                              {
                                'filaments.active': {
                                  equals: true,
                                },
                              },
                              {
                                'filaments.colour': {
                                  equals: colour,
                                },
                              },
                            ],
                          }
                        }

                        return {
                          'filaments.active': {
                            equals: true,
                          },
                        }
                      },
                    },
                    {
                      name: 'colour',
                      type: 'relationship',
                      relationTo: 'colours',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                      filterOptions: ({ siblingData }) => {
                        const material = resolveRelationID(siblingData?.material)

                        if (material) {
                          return {
                            and: [
                              {
                                'filaments.active': {
                                  equals: true,
                                },
                              },
                              {
                                'filaments.material': {
                                  equals: material,
                                },
                              },
                            ],
                          }
                        }

                        return {
                          'filaments.active': {
                            equals: true,
                          },
                        }
                      },
                    },
                  ],
                },
                {
                  name: 'filament',
                  type: 'relationship',
                  relationTo: 'filaments',
                  admin: {
                    readOnly: true,
                    position: 'sidebar',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'grams',
                      type: 'number',
                      min: 0,
                      admin: {
                        description: 'Estimated grams required for this print (used for pricing).',
                        width: '50%',
                      },
                    },
                    {
                      name: 'priceOverride',
                      type: 'number',
                      min: 0,
                      admin: {
                        description: 'Optional manual price in store currency (e.g., 24.5 overrides auto calc).',
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'notes',
              type: 'textarea',
              admin: {
                description: 'Optional requirements, deadlines, or context provided by the requester.',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [normalizeQuoteCustomer, resolveQuoteItemsAndAmount],
  },
}
