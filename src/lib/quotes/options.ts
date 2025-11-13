import type { Payload } from 'payload'

import type {
  ColourOption,
  FilamentCombination,
  MaterialOption,
  ProcessOption,
} from '@/lib/quotes/types'
import { extractSwatches, normalizeId } from '@/lib/quotes/utils'

type LoadQuoteWizardOptionsResult = {
  colourOptions: ColourOption[]
  combinations: FilamentCombination[]
  materialOptions: MaterialOption[]
  processOptions: ProcessOption[]
}

export const loadQuoteWizardOptions = async (
  payload: Payload,
): Promise<LoadQuoteWizardOptionsResult> => {
  const [filaments, materials, colours, processes, settings] = await Promise.all([
    payload.find({
      collection: 'filaments',
      pagination: false,
      select: {
        colour: true,
        id: true,
        material: true,
      },
      where: {
        active: {
          equals: true,
        },
      },
    }),
    payload.find({
      collection: 'materials',
      pagination: false,
      select: {
        id: true,
        name: true,
        pricePerGram: true,
      },
    }),
    payload.find({
      collection: 'colours',
      pagination: false,
      select: {
        finish: true,
        id: true,
        name: true,
        swatches: true,
        type: true,
      },
    }),
    payload.find({
      collection: 'processes',
      pagination: false,
      select: {
        active: true,
        id: true,
        name: true,
      },
      where: {
        active: {
          equals: true,
        },
      },
    }),
    payload.findGlobal({
      select: {
        pricePerGram: true,
      },
      slug: 'settings',
    }),
  ])

  const combinations: FilamentCombination[] = []
  const combinationKeys = new Set<string>()

  filaments.docs?.forEach((filament) => {
    const materialId =
      typeof filament.material === 'object' ? filament.material?.id : filament.material
    const colourId = typeof filament.colour === 'object' ? filament.colour?.id : filament.colour

    if (!materialId || !colourId) return

    const key = `${materialId}::${colourId}`

    if (combinationKeys.has(key)) return

    combinations.push({
      colourId: normalizeId(colourId),
      materialId: normalizeId(materialId),
    })
    combinationKeys.add(key)
  })

  const allowedMaterialIds = new Set(combinations.map((combo) => combo.materialId))
  const allowedColourIds = new Set(combinations.map((combo) => combo.colourId))

  const defaultPricePerGram =
    typeof settings?.pricePerGram === 'number' ? settings.pricePerGram : 0

  const materialOptions: MaterialOption[] =
    materials.docs
      ?.filter((material) => material?.id && allowedMaterialIds.has(normalizeId(material.id)))
      .map((material) => ({
        id: normalizeId(material.id),
        name: material.name ?? 'Untitled material',
        pricePerGram:
          typeof material.pricePerGram === 'number' ? material.pricePerGram : defaultPricePerGram,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  const colourOptions: ColourOption[] =
    colours.docs
      ?.filter((colour) => colour?.id && allowedColourIds.has(normalizeId(colour.id)))
      .map((colour) => ({
        finish: colour.finish ?? null,
        id: normalizeId(colour.id),
        name: colour.name ?? 'Untitled colour',
        swatches: extractSwatches(colour.swatches),
        type: colour.type ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  const processOptions: ProcessOption[] =
    processes.docs
      ?.filter((process) => process?.id && process.active)
      .map((process) => ({
        id: normalizeId(process.id),
        name: process.name ?? 'Untitled process',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  return {
    colourOptions,
    combinations,
    materialOptions,
    processOptions,
  }
}
