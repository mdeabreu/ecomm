import type { ReactNode } from 'react'

type LibraryGridProps = {
  children: ReactNode
}

export function LibraryGrid({ children }: LibraryGridProps) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</section>
  )
}
