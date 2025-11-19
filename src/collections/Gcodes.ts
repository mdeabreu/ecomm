import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

const queueSliceWorkflow: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (!doc || operation !== 'create' || req.context?.skipQueueSliceWorkflow) {
    return doc
  }

  try {
    const job = await req.payload.jobs.queue({
      workflow: 'sliceGcode',
      input: {
        gcodeId: doc.id,
      },
      queue: 'slicing',
    })

    req.payload.jobs.runByID({id: job.id})
    
  } catch (error) {
    req.payload.logger.error('Failed to queue slicing workflow', error)
  }

  return doc
}

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
    group: 'Jobs',
    useAsTitle: 'id',
    defaultColumns: ['quote', 'model', 'material', 'process', 'filament', 'machine', 'estimatedWeight', 'estimatedDuration'],
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
            width: '50%',
          },
        },
        {
          name: 'model',
          type: 'relationship',
          relationTo: 'models',
          required: true,
          admin: {
            readOnly: true,
            width: '50%',
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
          },
        },
        {
          name: 'filament',
          type: 'relationship',
          relationTo: 'filaments',
          required: true,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'process',
          type: 'relationship',
          relationTo: 'processes',
          required: true,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'machine',
          type: 'relationship',
          relationTo: 'machines',
          required: true,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
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
          name: 'estimatedDuration',
          type: 'number',
          min: 0,
          admin: {
            readOnly: true,
            description: 'Captured from slicer output (seconds).',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Slicer output',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'slicerOutput',
          type: 'textarea',
          admin: {
            readOnly: true,
            description: 'Stdout/stderr emitted by the slicer.',
          },
        },
        {
          name: 'gcode',
          label: 'G-code',
          type: 'code',
          admin: {
            readOnly: true,
            language: 'gcode',
            description: 'Captured from slicer output as plain text.',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [queueSliceWorkflow],
  },
}
