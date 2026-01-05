import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - now supports multiple departments
    const { email, password, department_id, department_ids } = await req.json();
    
    // Support both single department_id (legacy) and multiple department_ids
    const deptIds: string[] = department_ids || (department_id ? [department_id] : []);

    if (!email || !password || deptIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, and at least one department' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the first department as the primary (for legacy compatibility)
    const primaryDepartmentId = deptIds[0];

    // Create user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Unable to create department head. Please check the email is valid and not already in use.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User created successfully - no logging of sensitive IDs

    // Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'department_head',
        department_id: primaryDepartmentId,
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
    }

    // Create department_head_credentials entry with primary department
    const { data: credential, error: credError } = await supabaseAdmin
      .from('department_head_credentials')
      .insert({
        user_id: newUser.user.id,
        department_id: primaryDepartmentId,
        is_enabled: true,
        created_by: requestingUser.id,
      })
      .select('id')
      .single();

    if (credError || !credential) {
      console.error('Error creating credentials:', credError);
      // Try to clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Unable to complete department head setup. Please try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If there are additional departments, add them to the junction table
    if (deptIds.length > 1) {
      const additionalDepts = deptIds.slice(1).map((deptId) => ({
        credential_id: credential.id,
        department_id: deptId,
      }));
      
      const { error: junctionError } = await supabaseAdmin
        .from('department_head_departments')
        .insert(additionalDepts);

      if (junctionError) {
        console.error('Error adding additional departments:', junctionError);
        // Non-fatal - primary department is still assigned
      }
    }

    // Department head created successfully

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        message: 'Department head created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
