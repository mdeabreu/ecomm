import { ColourSwatch } from '@/components/colour/ColourSwatch'
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

      <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {colours.docs.length ? (
          colours.docs.map((colour) => (
            <ColourSwatch
              key={colour.id}
              description={colour.description}
              finish={colour.finish}
              image={colour.image}
              name={colour.name}
              swatches={colour.swatches ?? []}
              type={colour.type}
            />
          ))
        ) : (
          <p className="text-muted-foreground">No colours are published yet. Check back soon.</p>
        )}
      </section>
    </div>
  )
}
