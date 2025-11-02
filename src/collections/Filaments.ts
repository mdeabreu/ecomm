import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Filaments: CollectionConfig = {
  slug: 'filaments',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'material', 'vendor', 'colour'],
    group: '3D Printing',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: 'Uncheck to hide this filament from customer-facing selectors',
        position: 'sidebar',
      },
    },
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'materials',
      required: true,
    },
    {
      name: 'vendor',
      type: 'relationship',
      relationTo: 'vendors',
      required: true,
    },
    {
      name: 'colour',
      type: 'relationship',
      relationTo: 'colours',
      required: true,
    },
    {
      name: 'config',
      type: 'json',
      defaultValue: {},
      required: true,
      admin: {
        description: 'JSON metadata such as spool weight, print profiles, etc.',
      },
    },
    {
      name: 'purchases',
      type: 'array',
      labels: {
        plural: 'Purchases',
        singular: 'Purchase',
      },
      admin: {
        description: 'Track sourcing details per batch',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
          },
          validate: (value) => {
            if (!value) return 'URL is required'
            try {
              new URL(value)
              return true
            } catch {
              return 'Enter a valid purchase URL'
            }
          },
        },
        {
          name: 'pricePerUnit',
          type: 'number',
          min: 0,
          required: true,
        },
        {
          name: 'unitsPurchased',
          type: 'number',
          min: 1,
          required: true,
        },
      ],
    },
  ],
}
