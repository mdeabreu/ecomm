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
      admin: {
        description: 'Representative photo of a printed part or spool.',
      },
    },
    {
      name: 'pricePerGram',
      type: 'number',
      min: 0,
      admin: {
        description: 'Optional override; fallback is the Settings price per gram',
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
      label: 'Linked filaments',
      admin: {
        description: 'Preview filament records that reference this material',
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
