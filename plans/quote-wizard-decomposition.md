# Quote Flow Decomposition Plan

## Targets Worth Breaking Down
- `src/components/quote/QuoteWizard.tsx`: ~400 lines that juggle uploading, preference editing, review UI, submission, and success state. State, validation, and rendering are tightly coupled.
- `src/app/(app)/create-quote/page.tsx`: Fetches all filament/material/colour/process data inline, derives combinations, and feeds the wizard props. The derivation logic belongs in a reusable helper so other routes/APIs can reuse it.
- `src/collections/Quotes.ts`: Contains multiple helper hooks (`normalizeQuoteCustomer`, `resolveQuoteItemsAndAmount`) plus an inline field tree that is hard to scan. Server-side utilities should live beside other access/business helpers.

## Step-by-Step Breakdown Plan
1. **Codify shared quote types and helpers**
   - Create `src/lib/quotes/types.ts` for `MaterialOption`, `ColourOption`, `ProcessOption`, `FilamentCombination`, and payload-ready `QuoteItemInput`.
   - Export shared utilities (`normalizeId`, `formatFileSize`, swatch extraction) from `src/lib/quotes/utils.ts` so the wizard, API routes, and server loaders reuse the same logic.

2. **Encapsulate wizard state and validation**
   - Build a dedicated `useQuoteWizardState` hook under `src/components/quote/hooks/` that owns files, preferences, bulk selection, email/notes, and derived booleans (`allFilesConfigured`, `requiresEmail`, etc.).
   - Move logic for `getAvailableColoursForMaterial`, `updateFilePreference`, and `applyBulkSelections` into that hook so the UI layer only calls intent-oriented methods.

3. **Split the wizard UI into focused components**
   - Create `FileUploadStep`, `PreferenceStep`, `ReviewStep`, and `SuccessState` components inside `src/components/quote/wizard/`.
   - Extract repeated UI bits (`Stepper`, `ModelFileList`, `BulkPreferenceForm`) to smaller files to keep each component under ~150 lines.
   - Keep `QuoteWizard` as a thin orchestrator that wires the hook state to the step components.

4. **Isolate network side effects**
   - Add `src/lib/quotes/api.ts` with helpers like `uploadModelFile(file: File)` and `createQuote(payload)`.
   - Replace the inline `fetch` loops with these helpers (returning typed data and errors) so they can later be mocked in tests.

5. **Abstract summary formatting**
   - Introduce `buildCompletedQuoteSummary(files, preferences, maps)` in `src/lib/quotes/summary.ts` to centralize the logic that maps raw file info to the success card data.
   - Reuse the same helper when we eventually need to show a client-side preview before submitting.

6. **Modularize the create-quote loader**
   - Move the combination derivation and option filtering logic into `src/lib/quotes/options.ts` so `page.tsx`, API routes, or future server actions can compose it without duplicating filtering code.
   - Consider exposing a `loadQuoteWizardOptions(payload)` function that bundles the `Promise.all` and sorting concerns.

7. **Refactor the Payload collection config**
   - Extract the before-change hooks to `src/lib/payload/hooks/quotes/normalizeCustomer.ts` and `src/lib/payload/hooks/quotes/resolveItems.ts`, allowing unit coverage and easier reuse.
   - Move the large `items` field definition into `src/collections/fields/quoteItems.ts` (export a function that returns the array field config). The `Quotes` collection file can then import and spread that field, shrinking the file.

8. **Add targeted tests**
   - Write Vitest specs for the new helpers (`options`, `summary`, `resolveItems`, etc.) to confirm pricing, combination filtering, and validation rules still hold once code is split.
   - Add React Testing Library coverage for at least the wizard stepper flow to ensure the new component boundaries still allow navigation and error surfacing.

9. **Document and follow-up**
   - Update `ai-ref/reference` or README snippets to mention the new helper locations so future contributors know where to look for quote domain logic.
   - Add TODOs for any remaining monolith areas (e.g., `/api/quotes` route) if further decomposition is desired.
