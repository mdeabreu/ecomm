import { cn } from '@/utilities/cn'

type StepDefinition = {
  description: string
  title: string
}

type QuoteWizardStepperProps = {
  activeStep: number
  steps: readonly StepDefinition[]
}

export const QuoteWizardStepper: React.FC<QuoteWizardStepperProps> = ({ activeStep, steps }) => {
  return (
    <ol className="flex flex-col gap-4 md:flex-row md:gap-6">
      {steps.map((step, index) => {
        const isActive = index === activeStep
        const isComplete = index < activeStep
        const state = isActive ? 'active' : isComplete ? 'complete' : 'pending'

        return (
          <li
            className={cn(
              'flex flex-1 items-start gap-3 rounded-lg border px-4 py-3 text-sm transition',
              {
                'border-primary/40 bg-primary/5 text-primary': state === 'active',
                'border-muted-foreground/30 bg-muted/10': state === 'complete',
                'text-muted-foreground': state === 'pending',
              },
            )}
            key={step.title}
          >
            <span
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                {
                  'border-primary bg-primary text-primary-foreground': state === 'active',
                  'border-muted-foreground/20 bg-muted text-muted-foreground': state !== 'active',
                },
              )}
            >
              {index + 1}
            </span>
            <div>
              <div className="font-medium">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.description}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
