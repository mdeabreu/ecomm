import type { Media } from '@/payload-types'
import Image from 'next/image'
import type { ReactNode } from 'react'

type LibraryCardProps = {
  children?: ReactNode
  description?: string | null
  image?: Media | string | null
  name: string
  subtitle?: string | null
}

export function LibraryCard({ children, description, image, name, subtitle }: LibraryCardProps) {
  const media = typeof image === 'object' && image !== null ? image : null
  const imageUrl = media?.url

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card/40 p-3">
      {media && imageUrl ? (
        <div className="relative aspect-[3/2] overflow-hidden rounded-md border border-border/60 bg-muted">
          <Image
            alt={media.alt || `${name} reference image`}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={imageUrl}
          />
        </div>
      ) : null}
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground/90">{description}</p>
        ) : null}
      </header>
      {children}
    </article>
  )
}
