import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Machines: CollectionConfig = {
  slug: 'machines',
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
      admin: {
        width: '60%',
      },
    },
    {
      name: 'config',
      type: 'json',
      required: true,
      defaultValue: {},
      admin: {
        description: 'JSON definition for machine-specific settings.',
      },
    },
  ],
  orderable: true,
}
