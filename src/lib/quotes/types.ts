export type MaterialOption = {
  id: string
  name: string
}

export type ColourOption = {
  id: string
  name: string
  finish: string | null
  type: string | null
  swatches: string[]
}

export type ProcessOption = {
  id: string
  name: string
}

export type FilamentCombination = {
  materialId: string
  colourId: string
}

export type SelectedFile = {
  file: File
  id: string
}

export type FilePreference = {
  material: string | null
  colour: string | null
  process: string | null
  quantity: number
}

export type BulkPreference = Omit<FilePreference, 'quantity'>

export type CompletedQuoteItem = {
  modelName: string
  size: number
  materialName: string
  colourName: string
  processName: string
  colourSwatches: string[]
  quantity: number
}

export type CompletedQuote = {
  email?: string | null
  id: string
  items: CompletedQuoteItem[]
  notes?: string | null
}

export type QuoteItemInput = {
  colour: number
  material: number
  model: string | number
  process: number
  quantity: number
}
