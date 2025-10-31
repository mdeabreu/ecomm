import React from 'react'

type ColourSwatchProps = {
  name: string
  finish?: string | null
  type?: string | null
  swatches: { hexcode: string; id?: string | null }[] | null | undefined
}

export function ColourSwatch({ name, finish, type, swatches }: ColourSwatchProps) {
  const description = [finish, type].filter(Boolean).map(capitalize).join(' • ')

  return (
    <article className="rounded-lg border bg-card/40 p-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{name}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="mt-4 flex flex-wrap gap-3">
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
