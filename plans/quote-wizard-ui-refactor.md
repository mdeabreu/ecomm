UI Refactor Ideas

  - [x] Break QuoteWizardPreferenceStep into smaller pieces: implemented `BulkPreferencesCard` and `ModelPreferenceCard` under `src/components/quote/wizard/`
    so bulk form, per-file selectors, and quantity control are isolated and easier to test.
  - [x] Extract the shared file list visuals (used in upload step, review step, and success summary) into `ModelFileList` + `ModelFileRow`
    under `src/components/quote/wizard/`, wired into each step so actions/extra info stay consistent.
  - [x] Move the stepper/CTA footer into a `QuoteWizardNavigation` component with progress copy + button state handling so
    `QuoteWizard` only wires state/events.
  - [x] Introduce `QuoteSummaryCard` for the review/success model sections so both reuse the same layout (with optional notes/extras toggles).
  - [x] Create a lightweight QuoteWizard context (`src/components/quote/QuoteWizardContext.tsx`) so upload/preference/review steps pull state/actions without
    long prop chains, keeping the orchestrator lean as components grow.
