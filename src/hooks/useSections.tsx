import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Section {
  id: string;
  department_id: string;
  name: string;
  year: string;
  created_at: string;
}

export interface SectionWithSubmissionStatus extends Section {
  hasSubmitted: boolean;
}

/**
 * Hook for managing sections for a department
 */
export const useSections = (departmentId: string | null) => {
  const [sections, setSections] = useState<SectionWithSubmissionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSections = useCallback(async () => {
    if (!departmentId) {
      setSections([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch sections for the department
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('department_id', departmentId)
        .order('year')
        .order('name');

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        setSections([]);
        return;
      }

      if (!sectionsData || sectionsData.length === 0) {
        setSections([]);
        return;
      }

      // Fetch existing submissions for this department's sections
      const sectionIds = sectionsData.map((s) => s.id);
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('section_id')
        .in('section_id', sectionIds);

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      }

      const submittedSectionIds = new Set(
        submissionsData?.map((s) => s.section_id) || []
      );

      // Combine sections with submission status
      const sectionsWithStatus: SectionWithSubmissionStatus[] = sectionsData.map(
        (section) => ({
          ...section,
          hasSubmitted: submittedSectionIds.has(section.id),
        })
      );

      setSections(sectionsWithStatus);
    } catch (error) {
      console.error('Error in fetchSections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [departmentId, toast]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const refreshSections = useCallback(() => {
    setLoading(true);
    return fetchSections();
  }, [fetchSections]);

  return { sections, loading, refreshSections };
};
