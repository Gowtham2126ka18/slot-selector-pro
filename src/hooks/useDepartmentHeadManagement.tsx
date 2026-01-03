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
  department_id: string;
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
      // First, check if this department already has a head assigned
      const { data: existingHead } = await supabase
        .from('department_head_credentials')
        .select('id')
        .eq('department_id', data.department_id)
        .maybeSingle();

      if (existingHead) {
        toast({
          title: 'Department Already Assigned',
          description: 'This department already has a department head assigned.',
          variant: 'destructive',
        });
        return false;
      }

      // Create the user account via auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError || !authData.user) {
        toast({
          title: 'Error Creating User',
          description: authError?.message || 'Failed to create user account',
          variant: 'destructive',
        });
        return false;
      }

      // Create user_roles entry for department_head
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'department_head',
          department_id: data.department_id,
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // Continue anyway, we'll create the credentials
      }

      // Create department_head_credentials entry
      const { error: credError } = await supabase
        .from('department_head_credentials')
        .insert({
          user_id: authData.user.id,
          department_id: data.department_id,
          is_enabled: true,
        });

      if (credError) {
        toast({
          title: 'Error Creating Credentials',
          description: credError.message,
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
