import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSections, SectionWithSubmissionStatus } from '@/hooks/useSections';
import { useSlotSubmission } from '@/hooks/useSlotSubmission';
import Header from '@/components/Header';
import StepIndicator from '@/components/StepIndicator';
import SlotGrid from '@/components/SlotGrid';
import SelectionSummary from '@/components/SelectionSummary';
import SectionSelector from '@/components/SectionSelector';
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
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Building2,
  Layers,
} from 'lucide-react';

interface DepartmentInfo {
  id: string;
  name: string;
  year: string;
}

interface SlotRule {
  slot1_day: string;
  slot1_number: number;
  slot2_day: string;
  slot2_number: number;
  slot3_day: string;
  slot3_number: number;
}

const steps = [
  { number: 1, title: 'Section' },
  { number: 2, title: 'Slot 1' },
  { number: 3, title: 'Slot 2' },
  { number: 4, title: 'Slot 3' },
  { number: 5, title: 'Confirm' },
];

const DepartmentHeadDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const { submitSlots, submitting } = useSlotSubmission();

  const [department, setDepartment] = useState<DepartmentInfo | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotRules, setSlotRules] = useState<SlotRule[]>([]);
  const [systemLocked, setSystemLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSection, setSelectedSection] = useState<SectionWithSubmissionStatus | null>(null);
  const [selections, setSelections] = useState<SlotSelection>({
    slot1: null,
    slot2: null,
    slot3: null,
  });

  // Fetch sections for the department
  const { sections, loading: sectionsLoading, refreshSections } = useSections(department?.id || null);

  // Check if department has NO sections configured (legacy mode)
  const hasNoSections = !sectionsLoading && sections.length === 0;

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

        // Fetch slot dependency rules from database
        const { data: rulesData } = await supabase
          .from('slot_dependency_rules')
          .select('slot1_day, slot1_number, slot2_day, slot2_number, slot3_day, slot3_number');

        if (rulesData) {
          setSlotRules(rulesData);
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

  // Get allowed Slot 2 options based on Slot 1 selection and rules from DB
  const getAllowedSlot2Options = useCallback((slot1Id: string): string[] => {
    const [day, numStr] = slot1Id.split('-');
    const slotNum = parseInt(numStr);

    // Find all rules that match this Slot 1
    const matchingRules = slotRules.filter(
      (r) => r.slot1_day === day && r.slot1_number === slotNum
    );

    // Get unique Slot 2 options
    const slot2Options = new Set<string>();
    matchingRules.forEach((r) => {
      slot2Options.add(`${r.slot2_day}-${r.slot2_number}`);
    });

    return Array.from(slot2Options);
  }, [slotRules]);

  // Get allowed Slot 3 options based on Slot 1 and Slot 2 selection
  const getAllowedSlot3Options = useCallback((slot1Id: string, slot2Id: string): string[] => {
    const [day1, numStr1] = slot1Id.split('-');
    const slotNum1 = parseInt(numStr1);
    const [day2, numStr2] = slot2Id.split('-');
    const slotNum2 = parseInt(numStr2);

    // Find all rules that match this Slot 1 and Slot 2
    const matchingRules = slotRules.filter(
      (r) =>
        r.slot1_day === day1 &&
        r.slot1_number === slotNum1 &&
        r.slot2_day === day2 &&
        r.slot2_number === slotNum2
    );

    // Get unique Slot 3 options
    const slot3Options = new Set<string>();
    matchingRules.forEach((r) => {
      slot3Options.add(`${r.slot3_day}-${r.slot3_number}`);
    });

    return Array.from(slot3Options);
  }, [slotRules]);

  // Get allowed slots based on dependency rules
  const allowedSlots = useMemo(() => {
    // Step 2: Slot 1 selection
    if (currentStep === 2) {
      // Get all unique Slot 1 options from rules
      const slot1Options = new Set<string>();
      slotRules.forEach((r) => {
        slot1Options.add(`${r.slot1_day}-${r.slot1_number}`);
      });
      
      // Filter by availability
      return Array.from(slot1Options).filter((slotId) => {
        const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
        return slot && slot.capacity - slot.filled > 0;
      });
    }

    // Step 3: Slot 2 selection
    if (currentStep === 3 && selections.slot1) {
      const allowed = getAllowedSlot2Options(selections.slot1);
      return allowed.filter((slotId) => {
        const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
        return slot && slot.capacity - slot.filled > 0;
      });
    }

    // Step 4: Slot 3 selection
    if (currentStep === 4 && selections.slot1 && selections.slot2) {
      const allowed = getAllowedSlot3Options(selections.slot1, selections.slot2);
      return allowed.filter((slotId) => {
        const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
        return slot && slot.capacity - slot.filled > 0;
      });
    }

    return [];
  }, [currentStep, selections, slots, slotRules, getAllowedSlot2Options, getAllowedSlot3Options]);

  // Get disabled slots (not in allowed list)
  const disabledSlots = useMemo(() => {
    if (currentStep < 2 || currentStep > 4) return [];
    return slots
      .map((s) => `${s.day}-${s.slotNumber}`)
      .filter((id) => !allowedSlots.includes(id));
  }, [currentStep, allowedSlots, slots]);

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (selectedSection) completed.push(1);
    if (selections.slot1) completed.push(2);
    if (selections.slot2) completed.push(3);
    if (selections.slot3) completed.push(4);
    return completed;
  }, [selectedSection, selections]);

  const handleSectionSelect = (section: SectionWithSubmissionStatus) => {
    if (section.hasSubmitted) return;
    setSelectedSection(section);
    // Reset slot selections when section changes
    setSelections({ slot1: null, slot2: null, slot3: null });
  };

  const handleSlotSelect = (slotId: string) => {
    if (disabledSlots.includes(slotId)) return;

    const slot = slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
    if (!slot || slot.capacity - slot.filled <= 0) return;

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
        return selectedSection && !selectedSection.hasSubmitted;
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

  const handleSubmit = async () => {
    if (!department || !selectedSection || !selections.slot1 || !selections.slot2 || !selections.slot3) return;

    const result = await submitSlots({
      departmentId: department.id,
      sectionId: selectedSection.id,
      slot1Id: selections.slot1,
      slot2Id: selections.slot2,
      slot3Id: selections.slot3,
    });

    if (result.success) {
      // Refresh sections to update submission status
      await refreshSections();
      // Reset for next section
      setCurrentStep(1);
      setSelectedSection(null);
      setSelections({ slot1: null, slot2: null, slot3: null });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getCurrentSlot = () => {
    if (currentStep === 2) return selections.slot1;
    if (currentStep === 3) return selections.slot2;
    if (currentStep === 4) return selections.slot3;
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

  // Show locked state
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

  // Show message if no sections configured
  if (hasNoSections) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                No Sections Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{department.name} ({department.year})</span>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No sections have been configured for your department yet. Please contact the administrator to set up sections before you can submit slot selections.
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

  // Check if all sections have submitted
  const allSectionsSubmitted = sections.every((s) => s.hasSubmitted);

  if (allSectionsSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <CheckCircle2 className="h-5 w-5" />
                All Sections Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{department.name} ({department.year})</span>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">All sections have completed their slot submissions:</p>
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="font-medium">{section.name}</span>
                    <span className="text-sm text-muted-foreground">({section.year})</span>
                  </div>
                ))}
              </div>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All submissions are locked. Contact the administrator if changes are needed.
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
              <p className="text-sm text-muted-foreground">{department.year} Department</p>
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
            {/* Step 1: Section Selection */}
            {currentStep === 1 && (
              <div className="animate-fade-in rounded-xl border bg-card p-6 shadow-card">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Select Section
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose the section you want to allocate slots for. Sections that have already submitted are locked.
                  </p>
                </div>

                <SectionSelector
                  sections={sections}
                  selectedSection={selectedSection}
                  onSelect={handleSectionSelect}
                  selectedYear={null}
                />
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
                        ? 'Choose from available starting slots based on configured rules'
                        : currentStep === 3
                        ? 'Based on your first selection, only highlighted slots are available'
                        : 'Your third slot is determined by your previous selections'}
                    </p>
                  </div>
                </div>

                {slotRules.length === 0 && (
                  <Alert className="mb-6 border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-sm">
                      <strong>No Rules Configured:</strong> Contact the administrator to set up slot dependency rules before making selections.
                    </AlertDescription>
                  </Alert>
                )}

                {currentStep === 3 && selections.slot1 && (
                  <Alert className="mb-6 border-warning/30 bg-warning/5">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      <strong>Dependency Rule:</strong> You selected {selections.slot1} for Slot 1. 
                      Your Slot 2 must be one of the highlighted options.
                    </AlertDescription>
                  </Alert>
                )}

                {currentStep === 4 && selections.slot1 && selections.slot2 && (
                  <Alert className="mb-6 border-accent/30 bg-accent/5">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-sm">
                      <strong>Final Selection:</strong> Based on Slot 1 ({selections.slot1}) and Slot 2 ({selections.slot2}), 
                      select your Slot 3 from the highlighted options.
                    </AlertDescription>
                  </Alert>
                )}

                <SlotGrid
                  slots={slots}
                  selectedSlot={getCurrentSlot()}
                  disabledSlots={disabledSlots}
                  highlightedSlots={allowedSlots}
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
                      <span className="text-muted-foreground">Section:</span>{' '}
                      <span className="font-medium">{selectedSection?.name}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Year:</span>{' '}
                      <span className="font-medium">{selectedSection?.year}</span>
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
              section={selectedSection?.name}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepartmentHeadDashboard;
