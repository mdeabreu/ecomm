import type { Field } from 'payload'

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
            width: '33%',
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
})
