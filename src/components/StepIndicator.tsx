import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

const StepIndicator = ({ steps, currentStep, completedSteps }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = completedSteps.includes(step.number);
        const isPast = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                  {
                    'border-accent bg-accent text-accent-foreground': isActive || isCompleted,
                    'border-border bg-muted text-muted-foreground': !isActive && !isCompleted,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-2 text-center">
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-3 h-0.5 w-12 rounded-full transition-colors duration-300 sm:w-20',
                  isPast || isCompleted ? 'bg-accent' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
