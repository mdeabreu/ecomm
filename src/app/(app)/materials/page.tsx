import { LibraryGrid } from '@/components/library/LibraryGrid'
import { MaterialCard } from '@/components/material/MaterialCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description: 'Compare print materials, pricing, and print settings before submitting a quote.',
  title: 'Material Library',
}

export default async function MaterialsPage() {
  const payload = await getPayload({ config: configPromise })

  const [materials, settings] = await Promise.all([
    payload.find({
      collection: 'materials',
      depth: 1,
      limit: 200,
      overrideAccess: false,
      sort: 'name',
      where: {
        'filaments.active': {
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

  const settingsPricePerGram =
    typeof settings?.pricePerGram === 'number' ? settings.pricePerGram : null

  return (
    <div className="container py-10 md:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Material Library</h1>
        <p className="text-base text-muted-foreground">
          Learn how each filament behaves before you print. Every entry highlights pricing,
          recommended printer settings, and any callouts to help you choose the right material.
        </p>
      </header>

      {materials.docs.length ? (
        <LibraryGrid>
          {materials.docs.map((material) => (
            <MaterialCard
              key={material.id}
              description={material.description}
              image={material.image}
              name={material.name}
              pricePerGram={
                typeof material.pricePerGram === 'number'
                  ? material.pricePerGram
                  : settingsPricePerGram
              }
            />
          ))}
        </LibraryGrid>
      ) : (
        <p className="mt-10 text-muted-foreground">No materials are published yet. Check back soon.</p>
      )}
    </div>
  )
}
