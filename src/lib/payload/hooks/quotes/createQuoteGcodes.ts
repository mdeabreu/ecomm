import type { CollectionAfterChangeHook } from 'payload'

import { resolveRelationID } from '@/lib/quotes/relations'

type GcodeKey = {
  filament: number | string
  material: number | string
  model: number | string
  process: number | string
  machine: number | string
}

const buildKey = ({ filament, material, model, process, machine }: GcodeKey): string => {
  return [model, material, process, filament, machine].map(String).join(':')
}

export const createQuoteGcodes: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (!doc || operation === 'delete' || req.context?.skipCreateQuoteGcodes) {
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
    const machine = resolveRelationID(item.machine)

    if (!model || !material || !process || !filament || !machine) {
      continue
    }

    const key = buildKey({ filament, material, model, process, machine })
    combinations.set(key, { filament, material, model, process, machine })
  }

  if (combinations.size === 0) {
    return doc
  }

  const comboToGcodeID = new Map<string, number | string>()

  for (const [comboKey, combo] of combinations.entries()) {
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
          {
            machine: {
              equals: combo.machine,
            },
          },
        ],
      },
    })

    if (existing.docs.length > 0) {
      comboToGcodeID.set(comboKey, existing.docs[0].id)
      continue
    }

    const created = await req.payload.create({
      collection: 'gcodes',
      depth: 0,
      data: {
        quote: quoteID,
        model: combo.model,
        material: combo.material,
        process: combo.process,
        filament: combo.filament,
        machine: combo.machine,
      },
    })

    comboToGcodeID.set(comboKey, created.id)
  }

  if (comboToGcodeID.size === 0) {
    return doc
  }

  let itemsUpdated = false
  const updatedItems = doc.items.map((item) => {
    if (!item) return item

    const model = resolveRelationID(item.model)
    const material = resolveRelationID(item.material)
    const process = resolveRelationID(item.process)
    const filament = resolveRelationID(item.filament)
    const machine = resolveRelationID(item.machine)

    if (!model || !material || !process || !filament || !machine) {
      return item
    }

    const comboKey = buildKey({ filament, material, model, process, machine })
    const gcodeID = comboToGcodeID.get(comboKey)

    const currentGcodeID = resolveRelationID(item.gcode)
    if (!gcodeID || currentGcodeID === gcodeID) {
      return item
    }

    itemsUpdated = true
    return {
      ...item,
      gcode: gcodeID,
    }
  })

  if (!itemsUpdated) {
    return doc
  }

  await req.payload.update({
    collection: 'quotes',
    id: quoteID,
    data: {
      items: updatedItems,
    },
    depth: 0,
    context: {
      skipCreateQuoteGcodes: true,
    },
  })

  return {
    ...doc,
    items: updatedItems,
  }
}
