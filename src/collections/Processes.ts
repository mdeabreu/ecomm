import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Processes: CollectionConfig = {
  slug: 'processes',
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description: 'Uncheck to hide this process from customer-facing selectors',
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      label: 'Process configuration',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'config',
          type: 'json',
          defaultValue: {},
          required: true,
          admin: {
            description: 'JSON definition for slicer settings or workflow steps',
          },
        },
      ],
    },
  ],
}
