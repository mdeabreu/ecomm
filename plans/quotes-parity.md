# Quotes Feature Parity Plan

## Goals
- Allow guests and authenticated users to retrieve quote details the same way they can with orders.
- Align the Quotes UI with the existing Orders experience across list and detail views.
- Ensure account navigation, access policies, and supporting flows (like "find" forms) treat quotes and orders consistently.

## Prerequisites
- Review current Payload `quotes` collection schema and confirm support for storing a lookup email (e.g. reuse `customerEmail` or add a `requestEmail` field).
- Audit `/api/models` and `/api/quotes` handlers to confirm we can associate uploaded models and quote records with anonymous users.

## Implementation Steps

### 1. Data Model & Access
- [x] Extend the `quotes` collection with a guest-accessible email field (`customerEmail` or similar), keeping it required when no authenticated user is present.
- [x] Update create hooks so guest submissions persist the email alongside `customer` when available.
- [x] Verify `adminOrCustomerOwner` access grants read access when either the associated user or stored email matches.
- [x] Regenerate Payload types (`pnpm generate:types`) and reconcile TypeScript usage.

### 2. Quote Creation Flow
- [x] Update `QuoteWizard` to capture an email address when the requester is not authenticated.
- [x] Pass the email to `/api/quotes` and ensure the API stores it on the new field.
- [x] Surface validation states (e.g. email missing) and disable submission until requirements are met.
- [x] Adjust the success state copy to remind guests they can look up quotes with the provided email.

### 3. Guest Lookup Experience
- [x] Clone the orders "find" flow: create `/find-quote` route with a `FindQuoteForm`.
- [x] Redirect the quote wizard success CTA for guests to `/find-quote` (in addition to the direct detail link).
- [x] Add marketing entry points (e.g. footer/account nav) linking to the quote lookup page if desired.

### 4. Quote Detail Route (`/quotes/[id]`)
- [x] Mirror the orders guest access logic: accept `searchParams.email`, set `overrideAccess` when unauthenticated, and verify ownership by email or user ID before returning data.
- [x] Replace custom currency formatting with the shared `Price` component to match orders.
- [x] Swap bespoke status badge styling for the shared `QuoteStatus` component and align layout with the orders detail card (header copy, back button, container styles).
- [x] Show email-specific helper text when viewing as a guest (parity with orders copy if applicable).

### 5. Quote List Route (`/quotes`)
- [x] Confirm empty state copy matches tone and structure of `/orders`.
- [x] Ensure list items display model counts, price, and status using shared components (`QuoteItem` already aligns—tweak styles if necessary).

### 6. Shared Navigation & Account Surfaces
- [x] Update `AccountNav` to highlight `/quotes` for detail pages (`pathname.startsWith('/quotes')`), similar to existing orders logic.
- [x] Review the account dashboard (`/account`) to keep quotes and orders sections stylistically synced after detail updates.

### 7. Testing & QA
- [ ] Add Vitest integration coverage for the new quote lookup behavior (authenticated vs guest access).
- [ ] Manually test full flows: anonymous quote submission → detail lookup via email, authenticated submission → account views, and unauthorized access rejection.
- [ ] Run `pnpm lint` and `pnpm test:int` before committing changes.

### 8. Documentation & Follow-Up
- [ ] Update any relevant README or onboarding docs to mention quote lookup routes.
- [ ] Capture screenshots of new quote list/detail pages for the PR.
- [ ] Coordinate with backend/ops if new environment variables or migrations are required.
