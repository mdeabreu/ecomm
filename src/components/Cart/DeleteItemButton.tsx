'use client'

import type { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { XIcon } from 'lucide-react'
import React from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { removeItem } = useCart()
  const resolvedItemId = typeof item.id === 'string' ? Number(item.id) : item.id
  const canRemove = Number.isFinite(resolvedItemId)

  return (
    <form>
      <button
        aria-disabled={!canRemove}
        aria-label="Remove cart item"
        className={clsx(
          'ease hover:cursor-pointer flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200',
          {
            'cursor-not-allowed px-0': !canRemove,
          },
        )}
        disabled={!canRemove}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (canRemove) removeItem(resolvedItemId as number)
        }}
        type="button"
      >
        <XIcon className="hover:text-accent-3 mx-[1px] h-4 w-4 text-white dark:text-black" />
      </button>
    </form>
  )
}
