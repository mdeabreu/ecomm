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
    defaultColumns: ['name', 'pricePerGram'],
    group: 'Inventory',
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
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Short public blurb shown in the material library.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'pricePerGram',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      label: 'Material configuration',
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
            description: 'JSON blob describing printer settings (e.g., {"nozzleTemp": 210})',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Filaments',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'filaments',
          type: 'join',
          collection: 'filaments',
          on: 'material',
          admin: {
            defaultColumns: ['name', 'active'],
          },
        },
      ],
    },
  ],
}
