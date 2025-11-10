import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Vendors: CollectionConfig = {
  slug: 'vendors',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'url'],
    group: '3D Printing',
    useAsTitle: 'name',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            width: '40%',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Public storefront or vendor URL',
            width: '60%',
          },
          validate: (value) => {
            if (!value) return 'URL is required'

            try {
              // Throws if the URL is invalid
              new URL(value)
              return true
            } catch {
              return 'Enter a valid URL (include protocol)'
            }
          },
        },
      ],
    },
  ],
}
