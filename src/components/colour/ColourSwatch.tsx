import type { Media } from '@/payload-types'
import Image from 'next/image'
import React from 'react'

type ColourSwatchProps = {
  description?: string | null
  image?: Media | string | null
  name: string
  finish?: string | null
  type?: string | null
  swatches: { hexcode: string; id?: string | null }[] | null | undefined
}

export function ColourSwatch({
  description,
  image,
  name,
  finish,
  type,
  swatches,
}: ColourSwatchProps) {
  const finishSummary = [finish, type].filter(Boolean).map(capitalize).join(' • ')
  const media = typeof image === 'object' && image !== null ? image : null
  const imageUrl = media?.url

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card/40 p-3">
      {media && imageUrl ? (
        <div className="relative aspect-[3/2] overflow-hidden rounded-md border border-border/60 bg-muted">
          <Image
            alt={media.alt || `${name} colour reference`}
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={imageUrl}
          />
        </div>
      ) : null}
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        {finishSummary ? <p className="text-sm text-muted-foreground">{finishSummary}</p> : null}
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground/90">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-wrap gap-3">
        {swatches?.map((swatch) => (
          <SwatchBadge key={swatch.id ?? swatch.hexcode} hexcode={swatch.hexcode} name={name} />
        ))}
      </div>
    </article>
  )
}

function SwatchBadge({ hexcode, name }: { hexcode: string; name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-2 text-sm font-medium shadow-sm">
      <span
        aria-label={`${name} swatch ${hexcode}`}
        className="h-6 w-6 flex-none rounded-full border border-border"
        role="img"
        style={{ backgroundColor: hexcode }}
      />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {hexcode}
      </span>
    </div>
  )
}

function capitalize(value: string | null | undefined) {
  if (!value) return ''
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}
