import { LibraryCard } from '@/components/library/LibraryCard'
import type { Media } from '@/payload-types'
import { ecommerceCurrenciesConfig } from '@/config/currencies'

type MaterialCardProps = {
  description?: string | null
  image?: Media | string | null
  name: string
  pricePerGram?: number | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: ecommerceCurrenciesConfig.defaultCurrency,
})

export function MaterialCard({ description, image, name, pricePerGram }: MaterialCardProps) {
  const subtitle =
    typeof pricePerGram === 'number' ? `${currencyFormatter.format(pricePerGram)}/g` : undefined

  return <LibraryCard description={description} image={image} name={name} subtitle={subtitle} />
}
