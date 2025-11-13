import type { CollectionAfterChangeHook } from 'payload'

import { resolveRelationID } from '@/lib/quotes/relations'

type GcodeKey = {
  filament: number | string
  material: number | string
  model: number | string
  process: number | string
}

const buildKey = ({ filament, material, model, process }: GcodeKey): string => {
  return [model, material, process, filament].map(String).join(':')
}

export const createQuoteGcodes: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (!doc || operation === 'delete') {
    return doc
  }

  const quoteID = doc.id
  if (!quoteID || !Array.isArray(doc.items) || doc.items.length === 0) {
    return doc
  }

  const combinations = new Map<string, GcodeKey>()

  for (const item of doc.items) {
    if (!item) continue

    const model = resolveRelationID(item.model)
    const material = resolveRelationID(item.material)
    const process = resolveRelationID(item.process)
    const filament = resolveRelationID(item.filament)

    if (!model || !material || !process || !filament) {
      continue
    }

    const key = buildKey({ filament, material, model, process })
    combinations.set(key, { filament, material, model, process })
  }

  if (combinations.size === 0) {
    return doc
  }

  for (const combo of combinations.values()) {
    const existing = await req.payload.find({
      collection: 'gcodes',
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            quote: {
              equals: quoteID,
            },
          },
          {
            model: {
              equals: combo.model,
            },
          },
          {
            material: {
              equals: combo.material,
            },
          },
          {
            process: {
              equals: combo.process,
            },
          },
          {
            filament: {
              equals: combo.filament,
            },
          },
        ],
      },
    })

    if (existing.docs.length > 0) {
      continue
    }

    await req.payload.create({
      collection: 'gcodes',
      depth: 0,
      data: {
        quote: quoteID,
        model: combo.model,
        material: combo.material,
        process: combo.process,
        filament: combo.filament,
      },
    })
  }

  return doc
}
