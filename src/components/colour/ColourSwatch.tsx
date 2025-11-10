import { LibraryCard } from '@/components/library/LibraryCard'
import type { Media } from '@/payload-types'

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

  return (
    <LibraryCard description={description} image={image} name={name} subtitle={finishSummary}>
      <div className="flex flex-wrap gap-3">
        {swatches?.map((swatch) => (
          <SwatchBadge key={swatch.id ?? swatch.hexcode} hexcode={swatch.hexcode} name={name} />
        ))}
      </div>
    </LibraryCard>
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
