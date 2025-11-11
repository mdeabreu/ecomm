import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ColourOption,
  FilePreference,
  MaterialOption,
  ProcessOption,
  SelectedFile,
} from '@/lib/quotes/types'
import { formatFileSize, normalizeId } from '@/lib/quotes/utils'

type ModelPreferenceCardProps = {
  colourOptions: ColourOption[]
  file: SelectedFile
  materials: MaterialOption[]
  preferences: FilePreference
  processes: ProcessOption[]
  onPreferenceChange: (updates: Partial<FilePreference>) => void
}

export const ModelPreferenceCard: React.FC<ModelPreferenceCardProps> = ({
  colourOptions,
  file,
  materials,
  preferences,
  processes,
  onPreferenceChange,
}) => {
  const quantityInputId = `quantity-${file.id}`

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Material</Label>
          <Select
            onValueChange={(value) => onPreferenceChange({ material: value })}
            value={preferences.material ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={normalizeId(material.id)}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Colour</Label>
          <Select
            disabled={!preferences.material || !colourOptions.length}
            onValueChange={(value) => onPreferenceChange({ colour: value })}
            value={preferences.colour ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  preferences.material
                    ? colourOptions.length
                      ? 'Select colour'
                      : 'No colours available'
                    : 'Select material first'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {colourOptions.map((colour) => (
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
            onValueChange={(value) => onPreferenceChange({ process: value })}
            value={preferences.process ?? undefined}
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

        <div className="space-y-2">
          <Label htmlFor={quantityInputId}>Quantity</Label>
          <Input
            className="bg-transparent"
            id={quantityInputId}
            inputMode="numeric"
            min={1}
            onChange={(event) =>
              onPreferenceChange({
                quantity: Number.isNaN(event.target.valueAsNumber) ? 1 : event.target.valueAsNumber,
              })
            }
            step={1}
            type="number"
            value={preferences.quantity ?? 1}
          />
        </div>
      </div>
    </div>
  )
}
