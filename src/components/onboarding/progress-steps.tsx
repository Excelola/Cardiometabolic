type ProgressStepsProps = Readonly<{
  currentStep: number;
}>;

const STEPS = ["Consent", "About you", "Health context", "Baseline"] as const;

export function ProgressIndicator({ currentStep }: ProgressStepsProps) {
  return (
    <section aria-label="Onboarding progress">
      <p className="progress-steps__position">Step {currentStep} of {STEPS.length}</p>
      <ol className="progress-steps" role="list">
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
    </section>
  );
}

export const ProgressSteps = ProgressIndicator;
