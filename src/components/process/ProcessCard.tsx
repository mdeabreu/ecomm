import { LibraryCard } from '@/components/library/LibraryCard'
import type { Media } from '@/payload-types'

type ProcessCardProps = {
  description?: string | null
  image?: Media | string | null
  name: string
}

export function ProcessCard({ description, image, name }: ProcessCardProps) {
  return <LibraryCard description={description} image={image} name={name} />
}
