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

    await req.payload.update({
      collection: 'gcodes',
      id: doc.id,
      data: {
        sliceJobId: job.id,
      },
      depth: 0,
      context: {
        skipQueueSliceWorkflow: true,
      },
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
  hooks: {
    afterChange: [queueSliceWorkflow],
  },
}
