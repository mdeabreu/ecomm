import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Gcodes: CollectionConfig = {
  slug: 'gcodes',
  labels: {
    plural: 'Gcodes',
    singular: 'Gcode',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: '3D Printing',
    useAsTitle: 'id',
    defaultColumns: ['quote', 'model', 'material', 'process', 'filament'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'quote',
          type: 'relationship',
          relationTo: 'quotes',
          required: true,
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'model',
          type: 'relationship',
          relationTo: 'models',
          required: true,
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'sliceJobId',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Payload job identifier used to track the slicing workflow.',
            width: '34%',
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
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'process',
          type: 'relationship',
          relationTo: 'processes',
          required: true,
          admin: {
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'filament',
          type: 'relationship',
          relationTo: 'filaments',
          required: true,
          admin: {
            readOnly: true,
            width: '34%',
          },
        },
      ],
    },
    {
      name: 'estimatedWeight',
      type: 'number',
      min: 0,
      admin: {
        readOnly: true,
        description: 'Captured from slicer output (grams).',
      },
    },
    {
      name: 'gcode',
      label: 'G-code',
      type: 'code',
      admin: {
        readOnly: true,
        language: 'gcode',
        description: 'Populated after the slicing job completes.',
      },
    },
  ],
}
