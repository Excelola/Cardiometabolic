type ProgressStepsProps = Readonly<{
  currentStep: number;
}>;

const STEPS = ["Consent", "About you", "Health context", "Baseline"] as const;

export function ProgressIndicator({ currentStep }: ProgressStepsProps) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="progress-steps">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <li
              aria-current={stepNumber === currentStep ? "step" : undefined}
              className={stepNumber <= currentStep ? "is-active" : undefined}
              key={step}
            >
              <span aria-hidden="true">{stepNumber}</span>
              {step}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const ProgressSteps = ProgressIndicator;
