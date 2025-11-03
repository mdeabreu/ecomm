import { ColourSwatch } from '@/components/colour/ColourSwatch'
import type { Colour, Filament } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description: 'Browse available filament colours, finishes, and swatches.',
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
      }
    }
  })

  return (
    <div className="container py-10 md:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Colour Library</h1>
        <p className="text-base text-muted-foreground">
          Explore the colour finishes and material blends currently available for print jobs. Each
          entry includes one or more swatches representing how the colour appears in person.
        </p>
      </header>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {colours.docs.length ? (
          colours.docs.map((colour) => (
            <ColourSwatch
              key={colour.id}
              finish={colour.finish}
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
