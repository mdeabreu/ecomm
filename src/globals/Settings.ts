import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'machine',
      type: 'json',
      defaultValue: {},
      required: true,
      admin: {
        description: 'Default printer machine settings JSON',
      },
    },
    {
      name: 'process',
      type: 'json',
      defaultValue: {},
      required: true,
      admin: {
        description: 'Standard process parameters JSON',
      },
    },
    {
      name: 'filament',
      type: 'json',
      defaultValue: {},
      required: true,
      admin: {
        description: 'Baseline filament configuration JSON',
      },
    },
  ],
}
