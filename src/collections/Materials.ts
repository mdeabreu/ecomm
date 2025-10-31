import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Materials: CollectionConfig = {
  slug: 'materials',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name'],
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
      name: 'config',
      type: 'json',
      required: true,
      defaultValue: {},
      admin: {
        description: 'JSON blob describing printer settings (e.g., {"nozzleTemp": 210})',
      },
    },
    {
      name: 'pricePerGram',
      type: 'number',
      min: 0,
      admin: {
        description: 'Optional override; fallback is the Settings price per gram',
      },
    },
  ],
}
