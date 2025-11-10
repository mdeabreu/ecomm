import type { CollectionConfig } from 'payload'

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
    },
    {
      name: 'customerEmail',
      type: 'email',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Optional requirements, deadlines, or context provided by the requester.',
      },
    },
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
          name: 'model',
          type: 'relationship',
          relationTo: 'models',
          required: true,
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
          name: 'material',
          type: 'relationship',
          relationTo: 'materials',
          required: true,
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
        {
          name: 'process',
          type: 'relationship',
          relationTo: 'processes',
          required: true,
          filterOptions: () => {
            return {
              active: {
                equals: true,
              },
            }
          },
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
      ],
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
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const normalizedEmail =
          typeof data.customerEmail === 'string'
            ? data.customerEmail.trim().toLowerCase()
            : undefined

        if (!req.user && normalizedEmail) {
          data.customerEmail = normalizedEmail
        }

        const existingEmail =
          data.customerEmail ??
          (typeof originalDoc?.customerEmail === 'string' ? originalDoc.customerEmail : undefined)

        if (req.user) {
          data.customer = req.user.id
        } else if (!existingEmail) {
          throw new Error('Please include a contact email so we can follow up about your quote.')
        }

        if (Array.isArray(data.items) && data.items.length > 0) {
          const cache = new Map<string, number | null>()

          data.items = await Promise.all(
            data.items.map(async (item) => {
              if (!item) return item

              const material = resolveRelationID(item.material)
              const colour = resolveRelationID(item.colour)

              if (!material || !colour) {
                return {
                  ...item,
                  filament: null,
                }
              }

              const cacheKey = `${material}:${colour}`

              if (cache.has(cacheKey)) {
                return {
                  ...item,
                  filament: cache.get(cacheKey) ?? null,
                }
              }

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

              const filamentID = docs?.[0]?.id ?? null
              cache.set(cacheKey, filamentID)

              return {
                ...item,
                filament: filamentID,
              }
            }),
          )
        }

        return data
      },
    ],
  },
}
