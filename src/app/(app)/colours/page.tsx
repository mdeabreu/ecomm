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

  const filamentResults = await payload.find({
    collection: 'filaments',
    depth: 0,
    limit: 500,
    overrideAccess: false,
    select: {
      colour: true,
      active: true,
    },
    where: {
      active: {
        equals: true,
      },
    },
  })

  const activeColourIds = new Set<string | number>()
  ;(filamentResults.docs as Filament[]).forEach((filament) => {
    const colourRef = filament.colour
    if (typeof colourRef === 'object' && colourRef !== null) {
      activeColourIds.add(colourRef.id)
    } else if (colourRef) {
      activeColourIds.add(colourRef)
    }
  })

  let colours: Colour[] = []

  if (activeColourIds.size > 0) {
    const colourResults = await payload.find({
      collection: 'colours',
      depth: 0,
      limit: 200,
      overrideAccess: false,
      sort: 'name',
      where: {
        id: {
          in: Array.from(activeColourIds),
        },
      },
    })
    colours = colourResults.docs as Colour[]
  }

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
        {colours.length ? (
          colours.map((colour) => (
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
