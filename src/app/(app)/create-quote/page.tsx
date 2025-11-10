import type { Metadata } from 'next'

import { QuoteWizard } from '@/components/quote/QuoteWizard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const normalizeId = (value: string | number) => String(value)

const extractSwatches = (swatches: unknown): string[] => {
  if (!Array.isArray(swatches)) return []

  return swatches
    .map((item) => {
      if (item && typeof item === 'object' && 'hexcode' in item) {
        const hexcode = (item as { hexcode?: unknown }).hexcode
        return typeof hexcode === 'string' ? hexcode : null
      }

      return null
    })
    .filter((value): value is string => typeof value === 'string')
}

export const metadata: Metadata = {
  description:
    'Upload your STL models, choose materials and finishes, and request a custom quote in a few quick steps.',
  openGraph: {
    title: 'Custom quote',
    url: '/quotes',
  },
  title: 'Request a custom quote',
}

export default async function QuotePage() {
  const payload = await getPayload({ config: configPromise })

  const [filaments, materials, colours, processes] = await Promise.all([
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
  ])

  const combinations: Array<{ colourId: string; materialId: string }> = []
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

  const materialOptions =
    materials.docs
      ?.filter((material) => material?.id && allowedMaterialIds.has(normalizeId(material.id)))
      .map((material) => ({
        id: normalizeId(material.id),
        name: material.name ?? 'Untitled material',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  const colourOptions =
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

  const processOptions =
    processes.docs
      ?.filter((process) => process?.id && process.active)
      .map((process) => ({
        id: normalizeId(process.id),
        name: process.name ?? 'Untitled process',
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) ?? []

  return (
    <div className="container py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="prose dark:prose-invert">
          <h1>Custom quote wizard</h1>
          <p>
            Upload your models, select the material, colour, and process you prefer, and we&apos;ll
            review everything before sending a tailored quote. Guests can request a quote too—just
            keep the reference ID handy in case you reach out.
          </p>
        </div>

        <QuoteWizard
          colours={colourOptions}
          combinations={combinations}
          materials={materialOptions}
          processes={processOptions}
        />
      </div>
    </div>
  )
}
