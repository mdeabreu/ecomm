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
    defaultColumns: ['name', 'active'],
    group: 'Production',
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
        description: 'Uncheck to hide this machine from selections',
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      label: 'Machine configuration',
      admin: {
        initCollapsed: true,
      },
      fields: [
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
    },
  ],
  orderable: true,
}
