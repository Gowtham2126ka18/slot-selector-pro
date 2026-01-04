import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubmitSlotParams {
  departmentId: string;
  sectionId: string;
  slot1Id: string;
  slot2Id: string;
  slot3Id: string;
}

interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Hook for atomic slot submission with server-side validation
 * Uses the submit_slot_selection database function for race-condition-free booking
 */
export const useSlotSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submitSlots = async (params: SubmitSlotParams): Promise<SubmissionResult> => {
    setSubmitting(true);

    try {
      // Call the atomic database function
      const { data, error } = await supabase.rpc('submit_slot_selection', {
        p_department_id: params.departmentId,
        p_section_id: params.sectionId,
        p_slot1_id: params.slot1Id,
        p_slot2_id: params.slot2Id,
        p_slot3_id: params.slot3Id,
      });

      if (error) {
        console.error('Submission RPC error:', error);
        toast({
          title: 'Submission Failed',
          description: error.message || 'An error occurred during submission',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      // Parse the JSON response from the function
      const result = data as { success: boolean; error?: string; submission_id?: string };

      if (!result.success) {
        toast({
          title: 'Submission Rejected',
          description: result.error || 'Invalid submission',
          variant: 'destructive',
        });
        return { success: false, error: result.error };
      }

      toast({
        title: 'Slots Submitted Successfully!',
        description: 'Your slot selections have been locked.',
      });

      return { success: true, submissionId: result.submission_id };
    } catch (err: any) {
      console.error('Submission error:', err);
      toast({
        title: 'Submission Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  };

  return { submitSlots, submitting };
};
