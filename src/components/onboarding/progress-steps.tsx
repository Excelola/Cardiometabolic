type ProgressStepsProps = Readonly<{
  currentStep: number;
}>;

const STEPS = ["Your name", "Date of birth", "Country or market", "Consent"] as const;

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
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
