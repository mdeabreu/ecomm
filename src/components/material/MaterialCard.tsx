import { LibraryCard } from '@/components/library/LibraryCard'
import type { Media } from '@/payload-types'
import { formatPricePerGram } from '@/lib/quotes/utils'

type MaterialCardProps = {
  description?: string | null
  image?: Media | string | null
  name: string
  pricePerGram?: number | null
}

export function MaterialCard({ description, image, name, pricePerGram }: MaterialCardProps) {
  const subtitle =
    typeof pricePerGram === 'number' ? formatPricePerGram(pricePerGram) : undefined

  return <LibraryCard description={description} image={image} name={name} subtitle={subtitle} />
}
