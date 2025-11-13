export const normalizeId = (value: string | number) => String(value)

export const formatFileSize = (size?: number | null) => {
  if (typeof size !== 'number' || Number.isNaN(size) || size < 0) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export const extractSwatches = (swatches: unknown): string[] => {
  if (!Array.isArray(swatches)) return []

  return swatches
    .map((item) => {
      if (item && typeof item === 'object' && 'hexcode' in item) {
        const hexcode = (item as { hexcode?: unknown }).hexcode
        return typeof hexcode === 'string' ? hexcode : null
      }

      return null
    })
    .filter((value): value is string => typeof value === 'string')
}

const defaultCurrency = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'USD'
const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: defaultCurrency,
  style: 'currency',
})

export const formatPricePerGram = (price: number) => `${currencyFormatter.format(price)}/g`
