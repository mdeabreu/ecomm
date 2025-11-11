import { Button } from '@/components/ui/button'

type QuoteWizardNavigationProps = {
  activeStep: number
  canMoveForward: boolean
  canGoBack: boolean
  isSubmitting: boolean
  requiresEmail: boolean
  emailIsValid: boolean
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export const QuoteWizardNavigation: React.FC<QuoteWizardNavigationProps> = ({
  activeStep,
  canMoveForward,
  canGoBack,
  emailIsValid,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  requiresEmail,
  totalSteps,
}) => {
  const isLastStep = activeStep === totalSteps - 1

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="text-xs text-muted-foreground">
        Step {activeStep + 1} of {totalSteps}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {canGoBack ? (
          <Button disabled={isSubmitting} onClick={onBack} type="button" variant="outline">
            Back
          </Button>
        ) : null}

        {isLastStep ? (
          <Button
            disabled={isSubmitting || (requiresEmail && !emailIsValid)}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? 'Submitting…' : 'Submit quote'}
          </Button>
        ) : (
          <Button disabled={!canMoveForward || isSubmitting} onClick={onNext} type="button">
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
