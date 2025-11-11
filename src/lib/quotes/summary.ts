import type {
  ColourOption,
  CompletedQuoteItem,
  FilePreference,
  MaterialOption,
  ProcessOption,
  SelectedFile,
} from '@/lib/quotes/types'

type BuildCompletedQuoteSummaryArgs = {
  colourMap: Map<string, ColourOption>
  filePreferences: Record<string, FilePreference>
  files: SelectedFile[]
  materialMap: Map<string, MaterialOption>
  processMap: Map<string, ProcessOption>
}

export const buildCompletedQuoteSummary = ({
  colourMap,
  filePreferences,
  files,
  materialMap,
  processMap,
}: BuildCompletedQuoteSummaryArgs): CompletedQuoteItem[] => {
  return files.map((file) => {
    const prefs = filePreferences[file.id]
    const materialName = prefs?.material
      ? materialMap.get(prefs.material)?.name ?? 'Selected material'
      : 'Selected material'
    const colourDetails = prefs?.colour ? colourMap.get(prefs.colour) : null
    const processName = prefs?.process
      ? processMap.get(prefs.process)?.name ?? 'Selected process'
      : 'Selected process'
    const quantity =
      typeof prefs?.quantity === 'number' && Number.isFinite(prefs.quantity)
        ? Math.max(1, Math.floor(prefs.quantity))
        : 1

    return {
      colourName: colourDetails?.name ?? 'Selected colour',
      colourSwatches: colourDetails?.swatches || [],
      materialName,
      modelName: file.file.name,
      processName,
      quantity,
      size: file.file.size,
    }
  })
}
