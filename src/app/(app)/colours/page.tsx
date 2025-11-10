import { ColourSwatch } from '@/components/colour/ColourSwatch'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description: 'Browse available filament colours, finishes, swatches, and reference photos.',
  title: 'Colour Library',
}

export default async function ColoursPage() {
  const payload = await getPayload({ config: configPromise })

  const colours = await payload.find({
    collection: 'colours',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    sort: 'name',
    where: {
      'filaments.active': {
        equals: true,
      },
    },
  })

  return (
    <div className="container py-10 md:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Colour Library</h1>
        <p className="text-base text-muted-foreground">
          Explore the colour finishes and material blends currently available for print jobs. Each
          entry now includes reference photography, swatches, and a short description so you can
          pick the perfect filament before requesting a quote.
        </p>
      </header>

      {colours.docs.length ? (
        <LibraryGrid>
          {colours.docs.map((colour) => (
            <ColourSwatch
              key={colour.id}
              description={colour.description}
              finish={colour.finish}
              image={colour.image}
              name={colour.name}
              swatches={colour.swatches ?? []}
              type={colour.type}
            />
          ))}
        </LibraryGrid>
      ) : (
        <p className="mt-10 text-muted-foreground">No colours are published yet. Check back soon.</p>
      )}
    </div>
  )
}
