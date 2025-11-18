import fs from 'fs/promises'
import path from 'path'
import type { TaskHandler } from 'payload'

import { resolveRelationID } from '@/lib/quotes/relations'


type JSONObject = Record<string, unknown>

const isObject = (value: unknown): value is JSONObject => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

const deepMerge = (...sources: JSONObject[]): JSONObject => {
  const result: JSONObject = {}

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isObject(value) && isObject(result[key])) {
        result[key] = deepMerge(result[key] as JSONObject, value)
        continue
      }

      result[key] = value
    }
  }

  return result
}

const writeConfigFile = async (dir: string, filename: string, payload: JSONObject) => {
  await fs.mkdir(dir, { recursive: true })
  const fullPath = path.join(dir, filename)
  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf-8')
  return fullPath
}

export const collectSliceContext: TaskHandler<'collectSliceContext'> = async ({ input, req }) => {
  const gcodeId = input?.gcodeId
  if (!gcodeId) {
    throw new Error('collectSliceContext: gcodeId is required')
  }

  const gcode = await req.payload.findByID({
    collection: 'gcodes',
    id: gcodeId,
    depth: 0,
  })

  const materialId = resolveRelationID(gcode.material)
  const filamentId = resolveRelationID(gcode.filament)
  const processId = resolveRelationID(gcode.process)

  if (!materialId || !filamentId || !processId) {
    throw new Error('collectSliceContext: gcode is missing material, filament, or process reference')
  }

  const [settings, material, filament, processDoc] = await Promise.all([
    req.payload.findGlobal({ slug: 'settings', depth: 0 }),
    req.payload.findByID({ collection: 'materials', id: materialId, depth: 0 }),
    req.payload.findByID({ collection: 'filaments', id: filamentId, depth: 0 }),
    req.payload.findByID({ collection: 'processes', id: processId, depth: 0 }),
  ])

  const baseFilament = (isObject(settings.filament) ? settings.filament : {}) as JSONObject
  const materialConfig = (isObject(material.config) ? material.config : {}) as JSONObject
  const filamentConfig = (isObject(filament.config) ? filament.config : {}) as JSONObject
  const mergedFilament = deepMerge(baseFilament, materialConfig, filamentConfig)

  const baseProcess = (isObject(settings.process) ? settings.process : {}) as JSONObject
  const processConfig = (isObject(processDoc.config) ? processDoc.config : {}) as JSONObject
  const mergedProcess = deepMerge(baseProcess, processConfig)

  const machineConfig = (isObject(settings.machine) ? settings.machine : {}) as JSONObject

  const dir = path.join(process.cwd(), 'data', 'tmp', 'slicing', String(gcodeId))

  const [filamentConfigPath, processConfigPath, machineConfigPath] = await Promise.all([
    writeConfigFile(dir, 'filament.json', mergedFilament),
    writeConfigFile(dir, 'process.json', mergedProcess),
    writeConfigFile(dir, 'machine.json', machineConfig),
  ])

  const output: TaskCollectSliceContext["output"] = {
    filamentConfigPath,
    processConfigPath,
    machineConfigPath,
  }

  return {
    output,
  }
}
