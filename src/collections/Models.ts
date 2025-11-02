import type { CollectionConfig } from 'payload'

import path from 'path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Models: CollectionConfig = {
  slug: 'models',
  labels: {
    plural: 'Models',
    singular: 'Model',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['originalFilename', 'filename'],
    group: '3D Printing',
    useAsTitle: 'originalFilename',
  },
  fields: [
    {
      name: 'originalFilename',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeOperation: [
      ({ args, operation, req }) => {
        if ((operation == 'create' || operation == 'update') && req.file) {
          args.data.originalFilename = req.file.name

          const parsed = path.parse(req.file.name)
          const safeBase = parsed.name
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase()
          const uniqueSuffix = randomUUID()
          const base = safeBase || 'model'
          const extension = parsed.ext || '.stl'
          const uniqueFilename = `${base}-${uniqueSuffix}${extension}`

          req.file.name = uniqueFilename
        }
      },
    ],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../data/models'),
  },
}
