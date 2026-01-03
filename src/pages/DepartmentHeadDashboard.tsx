import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import StepIndicator from '@/components/StepIndicator';
import SlotGrid from '@/components/SlotGrid';
import SelectionSummary from '@/components/SelectionSummary';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  TimeSlot,
  SlotSelection,
  DAYS,
  SLOT_TIMES,
  SlotNumber,
  Day,
} from '@/lib/slotData';
import {
  getAllowedSlot2Options,
  getAllowedSlot3Options,
  validateSlotSelection,
} from '@/lib/slotDependencyRules';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Building2,
} from 'lucide-react';

interface DepartmentInfo {
  id: string;
  name: string;
  year: string;
}

const steps = [
  { number: 1, title: 'Slot 1' },
  { number: 2, title: 'Slot 2' },
  { number: 3, title: 'Slot 3' },
  { number: 4, title: 'Confirm' },
];

const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  const [department, setDepartment] = useState<DepartmentInfo | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<{
    slot1_id: string;
    slot2_id: string;
    slot3_id: string;
    submitted_at: string;
  } | null>(null);
  const [systemLocked, setSystemLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<SlotSelection>({
    slot1: null,
    slot2: null,
    slot3: null,
  });

  // Fetch department info and credentials for this user
  useEffect(() => {
    const fetchDepartmentInfo = async () => {
      if (!user) return;

      try {
        // Get department head credentials for this user
        const { data: credentials, error: credError } = await supabase
          .from('department_head_credentials')
          .select(`
            department_id,
            is_enabled,
            departments:department_id (id, name, year)
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (credError || !credentials) {
          toast({
            title: 'Access Denied',
            description: 'You are not assigned as a department head.',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        if (!credentials.is_enabled) {
          toast({
            title: 'Account Disabled',
            description: 'Your department head account has been disabled. Contact admin.',
            variant: 'destructive',
          });
          await signOut();
          navigate('/auth');
          return;
        }

        const dept = credentials.departments as unknown as DepartmentInfo;
        setDepartment(dept);

        // Check if already submitted
        const { data: submission } = await supabase
          .from('submissions')
          .select('slot1_id, slot2_id, slot3_id, submitted_at')
          .eq('department_id', dept.id)
          .maybeSingle();

        if (submission) {
          setHasSubmitted(true);
          setExistingSubmission(submission);
        }

        // Check system lock status
        const { data: settings } = await supabase
          .from('system_settings')
          .select('is_system_locked')
          .eq('id', 'main')
          .maybeSingle();

        if (settings?.is_system_locked) {
          setSystemLocked(true);
        }

        // Fetch slots
        const { data: slotsData } = await supabase
          .from('slots')
          .select('*')
          .order('day')
          .order('slot_number');

        if (slotsData) {
          const mappedSlots: TimeSlot[] = slotsData.map((s) => ({
            id: s.id,
            day: s.day as Day,
            slotNumber: s.slot_number as SlotNumber,
            time: SLOT_TIMES[s.slot_number as SlotNumber],
            capacity: s.capacity,
            filled: s.filled,
          }));
          setSlots(mappedSlots);
        }
      } catch (error) {
        console.error('Error fetching department info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDepartmentInfo();
    }
  }, [user, authLoading, navigate, toast, signOut]);

  // Get allowed slots based on dependency rules
  const allowedSlots = useMemo(() => {
    if (currentStep === 1) {
      // All available slots for Slot 1
      return slots
        .filter((s) => s.capacity - s.filled > 0)
        .map((s) => `${s.day}-${s.slotNumber}`);
    }

    if (currentStep === 2 && selections.slot1) {
      const allowed = getAllowedSlot2Options(selections.slot1);
      return allowed.filter((slotId) => {
        const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
        return slot && slot.capacity - slot.filled > 0;
      });
    }

    if (currentStep === 3 && selections.slot1 && selections.slot2) {
      const allowed = getAllowedSlot3Options(selections.slot1, selections.slot2);
      return allowed.filter((slotId) => {
        const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
        return slot && slot.capacity - slot.filled > 0;
      });
    }

    return [];
  }, [currentStep, selections, slots]);

  // Get disabled slots (not in allowed list)
  const disabledSlots = useMemo(() => {
    if (currentStep < 1 || currentStep > 3) return [];
    return slots
      .map((s) => `${s.day}-${s.slotNumber}`)
      .filter((id) => !allowedSlots.includes(id));
  }, [currentStep, allowedSlots, slots]);

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (selections.slot1) completed.push(1);
    if (selections.slot2) completed.push(2);
    if (selections.slot3) completed.push(3);
    return completed;
  }, [selections]);

  const handleSlotSelect = (slotId: string) => {
    if (disabledSlots.includes(slotId)) return;

    const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
    if (!slot || slot.capacity - slot.filled <= 0) return;

    if (currentStep === 1) {
      setSelections({ slot1: slotId, slot2: null, slot3: null });
    } else if (currentStep === 2) {
      // Reset slot 3 when changing slot 2
      setSelections((prev) => ({ ...prev, slot2: slotId, slot3: null }));
    } else if (currentStep === 3) {
      setSelections((prev) => ({ ...prev, slot3: slotId }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selections.slot1;
      case 2:
        return selections.slot2;
      case 3:
        return selections.slot3;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!department || !selections.slot1 || !selections.slot2 || !selections.slot3) return;

    // Validate the selection
    const validation = validateSlotSelection(
      selections.slot1,
      selections.slot2,
      selections.slot3
    );

    if (!validation.valid) {
      toast({
        title: 'Invalid Selection',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('submissions').insert({
        department_id: department.id,
        slot1_id: selections.slot1,
        slot2_id: selections.slot2,
        slot3_id: selections.slot3,
        submitted_by: user?.id,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Slots Submitted Successfully!',
        description: `${department.name} slots have been locked.`,
      });

      setHasSubmitted(true);
      setExistingSubmission({
        slot1_id: selections.slot1,
        slot2_id: selections.slot2,
        slot3_id: selections.slot3,
        submitted_at: new Date().toISOString(),
      });
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit slot selection',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getCurrentSlot = () => {
    if (currentStep === 1) return selections.slot1;
    if (currentStep === 2) return selections.slot2;
    if (currentStep === 3) return selections.slot3;
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !department) {
    return null;
  }

  // Show locked or already submitted state
  if (systemLocked) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Lock className="h-5 w-5" />
                System Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The slot selection system is currently locked by the administrator. Please check back later or contact the admin.
              </p>
              <Button onClick={handleSignOut} className="mt-4">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (hasSubmitted && existingSubmission) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <CheckCircle2 className="h-5 w-5" />
                Slots Already Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{department.name} ({department.year} Year)</span>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <span className="text-sm text-muted-foreground">Slot 1:</span>
                  <span className="ml-2 font-medium">{existingSubmission.slot1_id}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Slot 2:</span>
                  <span className="ml-2 font-medium">{existingSubmission.slot2_id}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Slot 3:</span>
                  <span className="ml-2 font-medium">{existingSubmission.slot3_id}</span>
                </div>
                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">Submitted:</span>
                  <span className="ml-2 text-sm">
                    {new Date(existingSubmission.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your submission is locked and cannot be modified. Contact the administrator if changes are needed.
                </AlertDescription>
              </Alert>
              <Button onClick={handleSignOut} className="mt-4">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Department Info Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{department.name}</h1>
              <p className="text-sm text-muted-foreground">{department.year} Year Department</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

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
            {/* Steps 1-3: Slot Selection */}
            {currentStep >= 1 && currentStep <= 3 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Select{' '}
                      {currentStep === 1
                        ? 'First'
                        : currentStep === 2
                        ? 'Second'
                        : 'Third'}{' '}
                      Slot
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentStep === 1
                        ? 'Choose any available slot to begin'
                        : currentStep === 2
                        ? 'Based on your first selection, only highlighted slots are available'
                        : 'Your third slot is determined by your previous selections'}
                    </p>
                  </div>
                </div>

                {currentStep === 2 && selections.slot1 && (
                  <Alert className="mb-6 border-warning/30 bg-warning/5">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      <strong>Dependency Rule:</strong> You selected {selections.slot1} for Slot 1. 
                      Your Slot 2 must be one of the highlighted options.
                    </AlertDescription>
                  </Alert>
                )}

                {currentStep === 3 && selections.slot1 && selections.slot2 && (
                  <Alert className="mb-6 border-accent/30 bg-accent/5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-sm">
                      <strong>Alternate Day Rule:</strong> Select a slot that is on an alternate day from {selections.slot2.split('-')[0]} 
                      (skip at least 1 day) and different from {selections.slot1.split('-')[0]}.
                    </AlertDescription>
                  </Alert>
                )}

                <SlotGrid
                  slots={slots}
                  selectedSlot={getCurrentSlot()}
                  disabledSlots={disabledSlots}
                  highlightedSlots={currentStep > 1 ? allowedSlots : []}
                  onSlotSelect={handleSlotSelect}
                />
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                    <CheckCircle2 className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Confirm Your Selection
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Please review your slot selections before submitting. This action cannot be undone.
                  </p>
                </div>

                <Alert className="mb-6 border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Once submitted, your selections will be locked and cannot be edited without admin approval.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="mb-3 font-medium text-foreground">Final Review</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Department:</span>{' '}
                      <span className="font-medium">{department.name}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Year:</span>{' '}
                      <span className="font-medium">{department.year} Year</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Slot 1:</span>{' '}
                      <span className="font-medium">{selections.slot1}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Slot 2:</span>{' '}
                      <span className="font-medium">{selections.slot2}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Slot 3:</span>{' '}
                      <span className="font-medium">{selections.slot3}</span>
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

              {currentStep < 4 ? (
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
                  disabled={submitting}
                  className="gap-2 bg-accent hover:bg-accent/90"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Selection'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Selection Summary */}
          <div className="lg:sticky lg:top-24">
            <SelectionSummary
              selections={selections}
              slots={slots}
              department={department.name}
              year={department.year as '2nd' | '3rd'}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepartmentHeadDashboard;
