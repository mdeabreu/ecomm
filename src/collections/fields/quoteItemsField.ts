import type { Field } from 'payload'

import { amountField } from '@payloadcms/plugin-ecommerce'

import { ecommerceCurrenciesConfig } from '@/config/currencies'
import { resolveRelationID } from '@/lib/quotes/relations'

export const quoteItemsField = (): Field => ({
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
            width: '75%',
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
          name: 'quantity',
          type: 'number',
          min: 1,
          required: true,
          defaultValue: 1,
          admin: {
            width: '25%',
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
            width: '33%',
          },
          filterOptions: ({ siblingData }) => {
            const colour = resolveRelationID(siblingData?.colour)
            const filament = resolveRelationID(siblingData?.filament)

            const constraints = [
              {
                'filaments.active': {
                  equals: true,
                }
              }
            ]

            if (filament) {
              constraints.push({
                filaments: {
                  contains: filament,
                }
              })
            }

            if (colour) {
              constraints.push({
                'filaments.colour': {
                  equals: colour,
                }
              })
            }

            return {
              and: constraints,
            }
          },
        },
        {
          name: 'colour',
          type: 'relationship',
          relationTo: 'colours',
          required: true,
          admin: {
            width: '33%',
          },
          filterOptions: ({ siblingData }) => {
            const material = resolveRelationID(siblingData?.material)
            const filament = resolveRelationID(siblingData?.filament)

            const constraints = [
              {
                'filaments.active': {
                  equals: true,
                }
              }
            ]

            if (filament) {
              constraints.push({
                filaments: {
                  contains: filament,
                }
              })
            }

            if (material) {
              constraints.push({
                'filaments.material': {
                  equals: material,
                }
              })
            }

            return {
              and: constraints,
            }
          },
        },
        {
          name: 'process',
          type: 'relationship',
          relationTo: 'processes',
          required: true,
          admin: {
            width: '33%',
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
      name: 'filament',
      type: 'relationship',
      relationTo: 'filaments',
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ siblingData }) => {
        const material = resolveRelationID(siblingData?.material)
        const colour = resolveRelationID(siblingData?.colour)

        const constraints = [
          {
            active: {
              equals: true,
            },
          },
        ]

        if (material) {
          constraints.push({
            material: {
              equals: material,
            },
          })
        }

        if (colour) {
          constraints.push({
            colour: {
              equals: colour,
            },
          })
        }

        return {
          and: constraints,
        }
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
            width: '25%',
          },
        },
        amountField({
          currenciesConfig: ecommerceCurrenciesConfig,
          overrides: {
            name: 'lineAmount',
            label: 'Subtotal',
            admin: {
              //description: 'Automatically calculated subtotal for this item.',
              readOnly: true,
              width: '25%',
            },
          },
        }),
        amountField({
          currenciesConfig: ecommerceCurrenciesConfig,
          overrides: {
            name: 'priceOverride',
            label: 'Price override',
            min: 0,
            admin: {
              //description: 'Optional manual price per unit in store currency.',
              width: '25%',
            },
          },
        }),
      ],
    },
  ],
})
