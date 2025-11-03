import type { CollectionConfig } from 'payload'

import { adminOrCustomerOwner } from '@/access/adminOrCustomerOwner'
import { publicAccess } from '@/access/publicAccess'

const ACTIVE_FILAMENT_QUERY = {
  active: {
    equals: true,
  },
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
    defaultColumns: ['status', 'price', 'material', 'colour'],
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
      name: 'models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      required: true,
      filterOptions: ({ data }) => {
        if (data.customer) {
          return {
            customer: {
              equals: data.customer,
            }
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
      filterOptions: ({ data }) => {
        if (data.colour) {
          return {
            and: [
              {
                'filaments.active': {
                  equals: true,
                },
              },
              {
                'filaments.colour': {
                  equals: data.colour,
                },
              },
            ],
          }
        } else {
          return {
            'filaments.active': {
              equals: true,
            },
          }
        }
      },
    },
    {
      name: 'colour',
      type: 'relationship',
      relationTo: 'colours',
      required: true,
      filterOptions: ({ data }) => {
        if (data.material) {
          return {
            and: [
              {
                'filaments.active': {
                  equals: true,
                },
              },
              {
                'filaments.material': {
                  equals: data.material,
                },
              },
            ],
          }
        } else {
          return {
            'filaments.active': {
              equals: true,
            },
          }
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
      }
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
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      min: 0,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const nextData = data || {}

        if (req.user) {
          nextData.customer ??= req.user.id
        }

        const materialId =
          typeof nextData.material === 'object' && nextData.material
            ? nextData.material.id
            : nextData.material

        const colourId =
          typeof nextData.colour === 'object' && nextData.colour
            ? nextData.colour.id
            : nextData.colour

        if (materialId && colourId) {
          if (!req.payload) {
            nextData.filament = null
            return nextData
          }

          const { docs } = await req.payload.find({
            collection: 'filaments',
            limit: 1,
            select: {
              id: true,
            },
            where: {
              and: [
                {
                  material: {
                    equals: materialId,
                  },
                },
                {
                  colour: {
                    equals: colourId,
                  },
                },
                ACTIVE_FILAMENT_QUERY,
              ],
            },
          })

          nextData.filament = docs?.[0]?.id ?? null
        } else {
          nextData.filament = null
        }

        return nextData
      },
    ],
  },
}
