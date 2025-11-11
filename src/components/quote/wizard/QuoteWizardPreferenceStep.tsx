import { useQuoteWizardContext } from '@/components/quote/QuoteWizardContext'
import { BulkPreferencesCard } from '@/components/quote/wizard/BulkPreferencesCard'
import { ModelPreferenceCard } from '@/components/quote/wizard/ModelPreferenceCard'
import React from 'react'

export const QuoteWizardPreferenceStep: React.FC = () => {
  const {
    applyBulkSelections,
    bulkColourOptions,
    bulkSelection,
    bulkSelectionReady,
    files,
    getAvailableColoursForMaterial,
    getPreferenceForFile,
    handleBulkSelectionChange,
    materials,
    processes,
    updateFilePreference,
  } = useQuoteWizardContext()

  if (!files.length) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload at least one model before selecting preferences.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {files.length > 1 ? (
        <BulkPreferencesCard
          bulkColourOptions={bulkColourOptions}
          bulkSelection={bulkSelection}
          bulkSelectionReady={bulkSelectionReady}
          materials={materials}
          processes={processes}
          onApply={applyBulkSelections}
          onSelectionChange={handleBulkSelectionChange}
        />
      ) : null}

      {files.map((item) => {
        const prefs = getPreferenceForFile(item.id)
        const colourOptions = getAvailableColoursForMaterial(prefs.material)
        return (
          <ModelPreferenceCard
            colourOptions={colourOptions}
            file={item}
            key={item.id}
            materials={materials}
            preferences={prefs}
            processes={processes}
            onPreferenceChange={(updates) => updateFilePreference(item.id, updates)}
          />
        )
      })}
    </section>
  )
}
