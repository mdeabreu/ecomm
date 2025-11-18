import fs from 'fs/promises'
import path from 'path'
import type { TaskHandler } from 'payload'

const FILAMENT_REGEX = /; filament used \[g\]\s*=\s*([\d.]+)/i
const DURATION_LINE_REGEX = /; total estimated time:\s*([^\r\n]+)/i
const DURATION_TOKEN_REGEX = /(\d+)\s*([hms])/gi

const parseDurationToSeconds = (raw: string): number | undefined => {
  let seconds = 0
  let matched = false

  for (const token of raw.matchAll(DURATION_TOKEN_REGEX)) {
    const value = Number(token[1])
    const unit = token[2].toLowerCase()

    if (Number.isNaN(value)) continue
    matched = true

    if (unit === 'h') {
      seconds += value * 3600
      continue
    }

    if (unit === 'm') {
      seconds += value * 60
      continue
    }

    if (unit === 's') {
      seconds += value
    }
  }

  return matched ? seconds : undefined
}

export const parseGcodeTask: TaskHandler<'parseGcode'> = async ({ req, input }) => {
  const gcodePath = input?.gcodePath
  const gcodeId = input?.gcodeId
  const slicerOutput = input?.slicerOutput

  if (!gcodeId) {
    throw new Error('parseGcode: gcodeId is required')
  }

  if (!gcodePath) {
    throw new Error('parseGcode: gcodePath is required')
  }

  const fileContents = await fs.readFile(gcodePath, 'utf-8')
  const filteredContents = (() => {
    const startMarker = '; EXECUTABLE_BLOCK_START'
    const endMarker = '; EXECUTABLE_BLOCK_END'
    const lines = fileContents.split(/\r?\n/)

    let inExecutableBlock = false
    const kept: string[] = []

    for (const line of lines) {
      if (line.trim() === startMarker) {
        inExecutableBlock = true
        continue
      }

      if (line.trim() === endMarker) {
        inExecutableBlock = false
        continue
      }

      if (inExecutableBlock) {
        continue
      }

      kept.push(line)
    }

    return kept.join('\n')
  })()

  let filamentUsedGrams: number | undefined
  const filamentMatch = fileContents.match(FILAMENT_REGEX)
  if (filamentMatch?.[1]) {
    const parsed = Number(filamentMatch[1])
    if (!Number.isNaN(parsed)) {
      filamentUsedGrams = parsed
    }
  }

  let estimatedDuration: number | undefined
  const durationMatch = fileContents.match(DURATION_LINE_REGEX)
  if (durationMatch?.[1]) {
    estimatedDuration = parseDurationToSeconds(durationMatch[1])
  }

  const fileBuffer = await fs.readFile(gcodePath)
  const filename = path.basename(gcodePath)

  await req.payload.update({
    collection: 'gcodes',
    id: gcodeId,
      data: {
        estimatedWeight: filamentUsedGrams,
        estimatedDuration,
        slicerOutput,
        gcode: filteredContents,
      },
    file: {
      data: fileBuffer,
      name: filename,
      mimetype: 'text/plain',
      size: fileBuffer.length,
    },
    depth: 0,
    context: {
      skipQueueSliceWorkflow: true,
    },
  })

  return {
    output: {
      gcodeId,
      gcodePath,
      filamentUsedGrams,
      estimatedDuration,
      slicerOutput,
    },
  }
}
