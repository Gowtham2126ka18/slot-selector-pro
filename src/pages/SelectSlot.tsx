import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import StepIndicator from '@/components/StepIndicator';
import DepartmentSelector from '@/components/DepartmentSelector';
import SlotGrid from '@/components/SlotGrid';
import SelectionSummary from '@/components/SelectionSummary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Year,
  SlotSelection,
  TimeSlot,
  generateSlots,
  getDependencyRule,
  getSlotStatus,
  DAYS,
} from '@/lib/slotData';
import { ArrowLeft, ArrowRight, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const steps = [
  { number: 1, title: 'Department' },
  { number: 2, title: 'Slot 1' },
  { number: 3, title: 'Slot 2' },
  { number: 4, title: 'Slot 3' },
  { number: 5, title: 'Confirm' },
];

const SelectSlot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selections, setSelections] = useState<SlotSelection>({
    slot1: null,
    slot2: null,
    slot3: null,
  });

  // Generate slots with mock data
  const slots = useMemo(() => generateSlots(), []);

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (selectedYear && selectedDepartment) completed.push(1);
    if (selections.slot1) completed.push(2);
    if (selections.slot2) completed.push(3);
    if (selections.slot3) completed.push(4);
    return completed;
  }, [selectedYear, selectedDepartment, selections]);

  // Get allowed slots based on dependency rules
  const allowedSlots = useMemo(() => {
    if (currentStep === 2) {
      // All available slots for Slot 1
      return slots
        .filter((s) => getSlotStatus(s) !== 'full')
        .map((s) => `${s.day}-${s.slotNumber}`);
    }

    if (currentStep === 3 && selections.slot1) {
      const rule = getDependencyRule(selections.slot1);
      if (rule) {
        return rule.allowedSlot2.filter((slotId) => {
          const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
          return slot && getSlotStatus(slot) !== 'full';
        });
      }
    }

    if (currentStep === 4 && selections.slot1) {
      const rule = getDependencyRule(selections.slot1);
      if (rule) {
        return rule.allowedSlot3.filter((slotId) => {
          const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
          return slot && getSlotStatus(slot) !== 'full';
        });
      }
    }

    return [];
  }, [currentStep, selections.slot1, slots]);

  // Get disabled slots (not in allowed list)
  const disabledSlots = useMemo(() => {
    if (currentStep < 2 || currentStep > 4) return [];
    return slots
      .map((s) => `${s.day}-${s.slotNumber}`)
      .filter((id) => !allowedSlots.includes(id));
  }, [currentStep, allowedSlots, slots]);

  const handleSlotSelect = (slotId: string) => {
    if (disabledSlots.includes(slotId)) return;

    const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
    if (!slot || getSlotStatus(slot) === 'full') return;

    if (currentStep === 2) {
      setSelections({ slot1: slotId, slot2: null, slot3: null });
    } else if (currentStep === 3) {
      setSelections((prev) => ({ ...prev, slot2: slotId, slot3: null }));
    } else if (currentStep === 4) {
      setSelections((prev) => ({ ...prev, slot3: slotId }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedYear && selectedDepartment;
      case 2:
        return selections.slot1;
      case 3:
        return selections.slot2;
      case 4:
        return selections.slot3;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: 'Slots Submitted Successfully!',
      description: `${selectedDepartment} (${selectedYear} Year) slots have been locked.`,
    });
    navigate('/');
  };

  const getCurrentSlot = () => {
    if (currentStep === 2) return selections.slot1;
    if (currentStep === 3) return selections.slot2;
    if (currentStep === 4) return selections.slot3;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Step 1: Department Selection */}
            {currentStep === 1 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <h2 className="mb-6 text-xl font-semibold text-foreground">
                  Select Your Department
                </h2>
                <DepartmentSelector
                  selectedYear={selectedYear}
                  selectedDepartment={selectedDepartment}
                  onYearChange={(year) => {
                    setSelectedYear(year);
                    setSelectedDepartment(null);
                  }}
                  onDepartmentChange={setSelectedDepartment}
                />
                {selectedYear && selectedDepartment && (
                  <Alert className="mt-6 border-accent/30 bg-accent/5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-sm">
                      You're selecting slots for{' '}
                      <strong>{selectedDepartment}</strong> ({selectedYear} Year).
                      Each department can submit only once.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Steps 2-4: Slot Selection */}
            {currentStep >= 2 && currentStep <= 4 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Select{' '}
                      {currentStep === 2
                        ? 'First'
                        : currentStep === 3
                        ? 'Second'
                        : 'Third'}{' '}
                      Slot
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep === 2
                        ? 'Choose any available slot to begin'
                        : 'Based on your first selection, only highlighted slots are available'}
                    </p>
                  </div>
                </div>

                {currentStep > 2 && (
                  <Alert className="mb-6 border-warning/30 bg-warning/5">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      <strong>Dependency Rule:</strong> Your first slot selection
                      determines which slots are available. Highlighted slots are
                      valid choices.
                    </AlertDescription>
                  </Alert>
                )}

                <SlotGrid
                  slots={slots}
                  selectedSlot={getCurrentSlot()}
                  disabledSlots={disabledSlots}
                  highlightedSlots={currentStep > 2 ? allowedSlots : []}
                  onSlotSelect={handleSlotSelect}
                />
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle2 className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Confirm Your Selection
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please review your slot selections before submitting. This action
                    cannot be undone.
                  </p>
                </div>

                <Alert className="mb-6 border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Once submitted, your selections will
                    be locked and cannot be edited without admin approval.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="mb-3 font-medium text-foreground">Final Review</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Year:</span>{' '}
                      <span className="font-medium">{selectedYear} Year</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Department:</span>{' '}
                      <span className="font-medium">{selectedDepartment}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Slots Selected:</span>{' '}
                      <span className="font-medium">3 of 3</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="gap-2 bg-accent hover:bg-accent/90"
                >
                  <Send className="h-4 w-4" />
                  Submit Selection
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Selection Summary */}
          <div className="lg:sticky lg:top-24">
            <SelectionSummary
              selections={selections}
              slots={slots}
              department={selectedDepartment}
              year={selectedYear}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectSlot;
