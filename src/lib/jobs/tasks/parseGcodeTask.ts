import fs from 'fs/promises'
import type { TaskHandler } from 'payload'

import type { SliceJobContext } from '../types'

const FILAMENT_REGEX = /; filament used \[g\]\s*=\s*([\d.]+)/i

export const parseGcodeTask: TaskHandler<SliceJobContext> = async ({ req, input }) => {
  const gcodePath = input?.slicedGcodePath || input?.gcodePath
  const gcodeId = input?.gcodeId

  if (!gcodeId) {
    throw new Error('parseGcode: gcodeId is required')
  }

  if (!gcodePath) {
    throw new Error('parseGcode: gcodePath is required')
  }

  const fileContents = await fs.readFile(gcodePath, 'utf-8')

  let filamentUsedGrams: number | undefined
  const match = fileContents.match(FILAMENT_REGEX)
  if (match?.[1]) {
    const parsed = Number(match[1])
    if (!Number.isNaN(parsed)) {
      filamentUsedGrams = parsed
    }
  }

  if (typeof filamentUsedGrams === 'number') {
    await req.payload.update({
      collection: 'gcodes',
      id: gcodeId,
      data: {
        estimatedWeight: filamentUsedGrams,
      },
      depth: 0,
      context: {
        skipQueueSliceWorkflow: true,
      },
    })
  }

  return {
    output: {
      gcodeId,
      gcodePath,
      filamentUsedGrams,
    },
  }
}

