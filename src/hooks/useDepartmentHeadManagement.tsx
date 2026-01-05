import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DepartmentHeadCredential {
  id: string;
  user_id: string;
  department_id: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  department?: {
    name: string;
    year: string;
  };
  user_email?: string;
}

export interface CreateDepartmentHeadData {
  email: string;
  password: string;
  department_id?: string;
  department_ids?: string[];
}

export const useDepartmentHeadManagement = () => {
  const [departmentHeads, setDepartmentHeads] = useState<DepartmentHeadCredential[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; year: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDepartments = useCallback(async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, year')
      .order('year', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }
    setDepartments(data || []);
  }, []);

  const fetchDepartmentHeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('department_head_credentials')
      .select(`
        *,
        departments:department_id (name, year)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching department heads:', error);
      return;
    }

    // The data comes with departments as an object, reshape it
    const reshaped = (data || []).map((item: any) => ({
      ...item,
      department: item.departments,
    }));

    setDepartmentHeads(reshaped);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDepartments(), fetchDepartmentHeads()]);
    setLoading(false);
  }, [fetchDepartments, fetchDepartmentHeads]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const createDepartmentHead = async (data: CreateDepartmentHeadData): Promise<boolean> => {
    try {
      // Get current session for authorization
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to create department heads.',
          variant: 'destructive',
        });
        return false;
      }

      // Call edge function to create user with admin privileges
      const { data: result, error } = await supabase.functions.invoke('create-department-head', {
        body: {
          email: data.email,
          password: data.password,
          department_id: data.department_id,
          department_ids: data.department_ids,
        },
      });

      if (error) {
        toast({
          title: 'Error Creating Department Head',
          description: error.message || 'Failed to create department head',
          variant: 'destructive',
        });
        return false;
      }

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Department Head Created',
        description: `Account created for ${data.email}`,
      });

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error creating department head:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleDepartmentHeadStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('department_head_credentials')
      .update({ is_enabled: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update department head status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: currentStatus ? 'Account Disabled' : 'Account Enabled',
      description: `Department head account has been ${currentStatus ? 'disabled' : 'enabled'}`,
    });

    await refreshData();
  };

  const deleteDepartmentHead = async (id: string, userId: string) => {
    // Note: We can only delete the credentials, not the auth user directly
    // The auth user would need to be deleted via Supabase dashboard or admin API
    const { error } = await supabase
      .from('department_head_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete department head',
        variant: 'destructive',
      });
      return;
    }

    // Also delete the user role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    toast({
      title: 'Department Head Deleted',
      description: 'The department head credentials have been removed',
    });

    await refreshData();
  };

  const getUnassignedDepartments = () => {
    const assignedDeptIds = new Set(departmentHeads.map((dh) => dh.department_id));
    return departments.filter((dept) => !assignedDeptIds.has(dept.id));
  };

  return {
    departmentHeads,
    departments,
    loading,
    createDepartmentHead,
    toggleDepartmentHeadStatus,
    deleteDepartmentHead,
    getUnassignedDepartments,
    refreshData,
  };
};
