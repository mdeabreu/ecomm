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
            width: '34%',
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
          name: 'filament',
          type: 'relationship',
          relationTo: 'filaments',
          admin: {
            position: 'sidebar',
            width: '50%',
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
          name: 'machine',
          type: 'relationship',
          relationTo: 'machines',
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
          name: 'gcode',
          type: 'relationship',
          relationTo: 'gcodes',
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'grams',
          type: 'number',
          min: 0,
          hooks: {
            afterRead: [async ({ siblingData, req, value }) => {
              const gcodeId = resolveRelationID(siblingData?.gcode)

              if (!gcodeId) {
                return value
              }

              try {
                const gcode = await req.payload.findByID({
                  collection: 'gcodes',
                  id: gcodeId,
                  depth: 0,
                })

                if (typeof gcode.estimatedWeight === 'number') {
                  return gcode.estimatedWeight
                }
              } catch {
                // ignore and fall back to existing value
              }

              return value
            }],
          },
          admin: {
            width: '33%',
            readOnly: true,
          },
        },
        {
          name: 'duration',
          type: 'number',
          min: 0,
          hooks: {
            afterRead: [async ({ siblingData, req, value }) => {
              const gcodeId = resolveRelationID(siblingData?.gcode)

              if (!gcodeId) {
                return value
              }

              try {
                const gcode = await req.payload.findByID({
                  collection: 'gcodes',
                  id: gcodeId,
                  depth: 0,
                })

                if (typeof gcode.estimatedDuration === 'number') {
                  return gcode.estimatedDuration
                }
              } catch {
                // ignore and fall back to existing value
              }

              return value
            }],
          },
          admin: {
            width: '34%',
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig: ecommerceCurrenciesConfig,
          overrides: {
            name: 'lineAmount',
            label: 'Subtotal',
            admin: {
              readOnly: true,
              width: '50%',
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
              width: '50%',
            },
          },
        }),
      ],
    },
  ],
})
