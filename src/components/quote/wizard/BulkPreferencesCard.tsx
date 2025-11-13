import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  BulkPreference,
  ColourOption,
  MaterialOption,
  ProcessOption,
} from '@/lib/quotes/types'
import { formatPricePerGram, normalizeId } from '@/lib/quotes/utils'

type BulkPreferencesCardProps = {
  bulkColourOptions: ColourOption[]
  bulkSelection: BulkPreference
  bulkSelectionReady: boolean
  materials: MaterialOption[]
  processes: ProcessOption[]
  onApply: () => void
  onSelectionChange: (field: keyof BulkPreference, value: string | null) => void
}

export const BulkPreferencesCard: React.FC<BulkPreferencesCardProps> = ({
  bulkColourOptions,
  bulkSelection,
  bulkSelectionReady,
  materials,
  processes,
  onApply,
  onSelectionChange,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-dashed border-muted-foreground/40 bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Bulk preferences</p>
          <p className="text-xs text-muted-foreground">
            Choose a material, colour, and process once, then apply them to every model. You can still
            customize individual files afterward.
          </p>
        </div>
        <Button disabled={!bulkSelectionReady} onClick={onApply} type="button" variant="outline">
          Apply to all models
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Material</Label>
          <Select
            onValueChange={(value) => onSelectionChange('material', value)}
            value={bulkSelection.material ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={normalizeId(material.id)}>
                  {material.name} • {formatPricePerGram(material.pricePerGram)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Colour</Label>
          <Select
            disabled={!bulkSelection.material || !bulkColourOptions.length}
            onValueChange={(value) => onSelectionChange('colour', value)}
            value={bulkSelection.colour ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  bulkSelection.material
                    ? bulkColourOptions.length
                      ? 'Select colour'
                      : 'No colours available'
                    : 'Select material first'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {bulkColourOptions.map((colour) => (
                <SelectItem key={colour.id} value={normalizeId(colour.id)}>
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-5 rounded-full border"
                      style={{
                        backgroundColor: colour.swatches?.[0] ?? '#f1f5f9',
                      }}
                    />
                    <span>
                      <span className="block font-medium">{colour.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[colour.finish, colour.type].filter(Boolean).join(' • ')}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Process</Label>
          <Select
            onValueChange={(value) => onSelectionChange('process', value)}
            value={bulkSelection.process ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select process" />
            </SelectTrigger>
            <SelectContent>
              {processes.map((process) => (
                <SelectItem key={process.id} value={normalizeId(process.id)}>
                  {process.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
