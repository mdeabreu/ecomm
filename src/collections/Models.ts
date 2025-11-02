import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminOnly } from '@/access/adminOnly'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Models: CollectionConfig = {
  slug: 'models',
  labels: {
    singular: 'Model',
    plural: 'Models',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'filename'],
    group: '3D Printing',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/models'),
    mimeTypes: ['model/stl', 'application/sla', 'application/octet-stream'],
  },
}
