import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DAYS, SLOT_TIMES, SlotNumber } from '@/lib/slotData';

export interface Slot {
  id: string;
  day: string;
  slot_number: number;
  time_range: string;
  capacity: number;
  filled: number;
}

export interface Submission {
  id: string;
  department_id: string;
  slot1_id: string;
  slot2_id: string;
  slot3_id: string;
  submitted_at: string;
  is_locked: boolean;
  departments?: {
    name: string;
    year: string;
  };
}

export interface SystemSettings {
  is_system_locked: boolean;
  lock_message: string | null;
}

export const useSlotManagement = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ is_system_locked: false, lock_message: null });
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    const { data, error } = await supabase.from('slots').select('*');
    if (error) {
      console.error('Error fetching slots:', error);
      return;
    }
    setSlots(data || []);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        departments (name, year)
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching submissions:', error);
      return;
    }
    setSubmissions(data || []);
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching system settings:', error);
      return;
    }
    if (data) {
      setSystemSettings({
        is_system_locked: data.is_system_locked,
        lock_message: data.lock_message,
      });
    }
  }, []);

  const initializeSlots = useCallback(async () => {
    // Check if slots already exist
    const { data: existingSlots } = await supabase.from('slots').select('id').limit(1);
    
    if (existingSlots && existingSlots.length > 0) {
      return; // Slots already initialized
    }

    // Create all slots
    const slotsToInsert = DAYS.flatMap((day) =>
      ([1, 2, 3] as SlotNumber[]).map((slotNumber) => ({
        id: `${day}-${slotNumber}`,
        day,
        slot_number: slotNumber,
        time_range: SLOT_TIMES[slotNumber],
        capacity: 7,
        filled: 0,
      }))
    );

    const { error } = await supabase.from('slots').insert(slotsToInsert);
    if (error) {
      console.error('Error initializing slots:', error);
    }
  }, []);

  const clearAllSubmissions = async () => {
    const { error } = await supabase.rpc('clear_all_submissions');
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear submissions: ' + error.message,
        variant: 'destructive',
      });
      return false;
    }
    toast({
      title: 'Success',
      description: 'All submissions have been cleared and slots reset.',
    });
    await fetchSlots();
    await fetchSubmissions();
    return true;
  };

  const resetAllSlots = async () => {
    const { error } = await supabase.rpc('reset_all_slots');
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset slots: ' + error.message,
        variant: 'destructive',
      });
      return false;
    }
    toast({
      title: 'Success',
      description: 'All slot counts have been reset to 0.',
    });
    await fetchSlots();
    return true;
  };

  const deleteSubmission = async (submissionId: string) => {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete submission: ' + error.message,
        variant: 'destructive',
      });
      return false;
    }
    toast({
      title: 'Success',
      description: 'Submission deleted successfully.',
    });
    await fetchSlots();
    await fetchSubmissions();
    return true;
  };

  const toggleSystemLock = async () => {
    const newLockState = !systemSettings.is_system_locked;
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        is_system_locked: newLockState,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main');
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update system lock: ' + error.message,
        variant: 'destructive',
      });
      return false;
    }
    setSystemSettings({ ...systemSettings, is_system_locked: newLockState });
    toast({
      title: 'Success',
      description: newLockState ? 'System has been locked.' : 'System has been unlocked.',
    });
    return true;
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initializeSlots();
      await Promise.all([fetchSlots(), fetchSubmissions(), fetchSystemSettings()]);
      setLoading(false);
    };
    init();
  }, [initializeSlots, fetchSlots, fetchSubmissions, fetchSystemSettings]);

  return {
    slots,
    submissions,
    systemSettings,
    loading,
    clearAllSubmissions,
    resetAllSlots,
    deleteSubmission,
    toggleSystemLock,
    refreshData: async () => {
      await Promise.all([fetchSlots(), fetchSubmissions(), fetchSystemSettings()]);
    },
  };
};
