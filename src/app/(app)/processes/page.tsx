import { LibraryGrid } from '@/components/library/LibraryGrid'
import { ProcessCard } from '@/components/process/ProcessCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const metadata = {
  description: 'Review print process options and choose the right balance of speed and quality.',
  title: 'Process Library',
}

export default async function ProcessesPage() {
  const payload = await getPayload({ config: configPromise })

  const processes = await payload.find({
    collection: 'processes',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: 'name',
    where: {
      active: {
        equals: true,
      },
    },
  })

  return (
    <div className="container py-10 md:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Process Library</h1>
        <p className="text-base text-muted-foreground">
          Compare printer workflows to understand surface finish, turnaround expectations, and ideal
          use cases for each process tier.
        </p>
      </header>

      {processes.docs.length ? (
        <LibraryGrid>
          {processes.docs.map((process) => (
            <ProcessCard
              key={process.id}
              description={process.description}
              image={process.image}
              name={process.name}
            />
          ))}
        </LibraryGrid>
      ) : (
        <p className="mt-10 text-muted-foreground">No processes are published yet. Check back soon.</p>
      )}
    </div>
  )
}
