import { useQuoteWizardContext } from '@/components/quote/QuoteWizardContext'
import { ModelFileList } from '@/components/quote/wizard/ModelFileList'
import { ModelFileRow } from '@/components/quote/wizard/ModelFileRow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloudIcon, XCircleIcon } from 'lucide-react'

export const QuoteWizardUploadStep: React.FC = () => {
  const { files, handleFileChange, fileInputRef, removeFile } = useQuoteWizardContext()

  return (
    <section className="space-y-4">
      <Label htmlFor="model-upload">Upload STL files</Label>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center transition hover:border-primary/60 hover:bg-primary/5"
        htmlFor="model-upload"
      >
        <UploadCloudIcon aria-hidden="true" className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Drag & drop your files or click to browse</p>
          <p className="text-xs text-muted-foreground">Supports .stl and .obj up to 200MB each</p>
        </div>
        <Input
          accept=".stl,.obj"
          className="hidden"
          id="model-upload"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </label>

      {files.length ? (
        <ModelFileList>
          {files.map((item) => (
            <ModelFileRow
              actions={
                <button
                  aria-label={`Remove ${item.file.name}`}
                  className="text-muted-foreground transition hover:text-destructive"
                  onClick={() => removeFile(item.id)}
                  type="button"
                >
                  <XCircleIcon aria-hidden="true" className="size-5" />
                </button>
              }
              key={item.id}
              name={item.file.name}
              size={item.file.size}
            />
          ))}
        </ModelFileList>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add the model files you would like us to quote. You can remove them before continuing.
        </p>
      )}
    </section>
  )
}
