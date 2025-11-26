import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

const canUseNextRevalidate = (): boolean => {
  return typeof globalThis !== 'undefined' && Boolean((globalThis as any).__nextIncrementalCache)
}

const tryRevalidatePath = (payload: Payload, path: string) => {
  if (!canUseNextRevalidate()) return

  payload.logger.info(`Revalidating page at path: ${path}`)

  try {
    revalidatePath(path)
  } catch (err) {
    payload.logger.error(`Error revalidating path ${path}`)
    payload.logger.error(err)
  }
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate || !canUseNextRevalidate()) return doc

  if (doc._status === 'published') {
    const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
    tryRevalidatePath(payload, path)
    //revalidateTag('pages-sitemap')
  }

  // If the page was previously published, we need to revalidate the old path
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`
    tryRevalidatePath(payload, oldPath)
    //revalidateTag('pages-sitemap')
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { context, payload },
}) => {
  if (context.disableRevalidate || !canUseNextRevalidate()) return doc

  const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
  tryRevalidatePath(payload, path)
  //revalidateTag('pages-sitemap')

  return doc
}
