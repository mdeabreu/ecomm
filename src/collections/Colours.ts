import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Colours: CollectionConfig = {
  slug: 'colours',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'finish', 'type'],
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
        width: '50%',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional blurb displayed in the public colour library.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Use a lifestyle or spool photo to represent this colour.',
      },
    },
    {
      name: 'finish',
      type: 'select',
      defaultValue: 'regular',
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'Matte', value: 'matte' },
        { label: 'Silk', value: 'silk' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'solid',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Co-extrusion', value: 'co-extrusion' },
        { label: 'Gradient', value: 'gradient' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      label: 'Swatches',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'swatches',
          type: 'array',
          labels: {
            plural: 'Swatches',
            singular: 'Swatch',
          },
          minRows: 1,
          fields: [
            {
              name: 'hexcode',
              type: 'text',
              required: true,
              admin: {
                description: 'Hex value including #, e.g. #FFAA00',
                width: '50%',
              },
              validate: (value) => {
                if (typeof value !== 'string') return 'Provide a valid hex code'
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
                  ? true
                  : 'Use a valid hex code including #'
              },
            },
          ],
        },
      ],
    },
    {
      name: 'filaments',
      type: 'join',
      collection: 'filaments',
      on: 'colour',
      admin: {
        defaultColumns: ['name', 'active'],
      },
    },
  ],
}
