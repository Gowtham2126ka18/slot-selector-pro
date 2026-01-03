import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Department lists
const SECOND_YEAR_DEPARTMENTS = [
  'CSE GEN A', 'CSE GEN B', 'CSE STAR A', 'CSE STAR B', 'CSE STAR C',
  'CTIS & CTMA', 'AI', 'BCT & CPS', 'IOT', 'SE', 'Cyber security',
  'AIML A', 'AIML B', 'AIML C', 'AIML D', 'Data Science', 'AIDE',
  'CSBS', 'ISE', 'AI Dev ops'
];

const THIRD_YEAR_DEPARTMENTS = [
  'CSE GEN A', 'CSE GEN B', 'CSE STAR A', 'CSE STAR B', 'CSE STAR C',
  'CTIS & CTMA', 'AI', 'IOT', 'SE', 'Cyber security',
  'AIML A', 'AIML B', 'AIML C', 'AIML D', 'Data Science', 'AIDE',
  'CSBS', 'ISE'
];

// Slots configuration
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_TIMES: Record<number, string> = {
  1: '8:45 AM – 10:00 AM',
  2: '11:00 AM – 1:00 PM',
  3: '2:00 PM – 3:45 PM',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get seed key from request for security
    const { seed_key } = await req.json();
    
    // Simple security check - in production, use a more secure method
    const expectedKey = Deno.env.get("SEED_KEY") || "sixphrase-seed-2024";
    if (seed_key !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Invalid seed key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: string[] = [];

    // 1. Create initial admin user if not exists
    const adminEmail = "jainsixphrasecoordinator@admin.local";
    const adminPassword = "Sixphrase@123";

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === adminEmail);

    if (!adminExists) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (createError) {
        results.push(`Error creating admin: ${createError.message}`);
      } else if (newUser?.user) {
        // Add admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role: 'admin' });

        if (roleError) {
          results.push(`Error adding admin role: ${roleError.message}`);
        } else {
          results.push(`Admin user created: ${adminEmail}`);
        }
      }
    } else {
      results.push("Admin user already exists");
    }

    // 2. Seed departments if empty
    const { data: existingDepts, error: deptCheckError } = await supabaseAdmin
      .from('departments')
      .select('id')
      .limit(1);

    if (!deptCheckError && (!existingDepts || existingDepts.length === 0)) {
      // Insert 2nd year departments
      const secondYearDepts = SECOND_YEAR_DEPARTMENTS.map(name => ({
        name,
        year: '2nd',
      }));

      const { error: insertError2 } = await supabaseAdmin
        .from('departments')
        .insert(secondYearDepts);

      if (insertError2) {
        results.push(`Error seeding 2nd year departments: ${insertError2.message}`);
      } else {
        results.push(`Seeded ${SECOND_YEAR_DEPARTMENTS.length} 2nd year departments`);
      }

      // Insert 3rd year departments
      const thirdYearDepts = THIRD_YEAR_DEPARTMENTS.map(name => ({
        name,
        year: '3rd',
      }));

      const { error: insertError3 } = await supabaseAdmin
        .from('departments')
        .insert(thirdYearDepts);

      if (insertError3) {
        results.push(`Error seeding 3rd year departments: ${insertError3.message}`);
      } else {
        results.push(`Seeded ${THIRD_YEAR_DEPARTMENTS.length} 3rd year departments`);
      }
    } else {
      results.push("Departments already seeded");
    }

    // 3. Seed slots if empty
    const { data: existingSlots, error: slotCheckError } = await supabaseAdmin
      .from('slots')
      .select('id')
      .limit(1);

    if (!slotCheckError && (!existingSlots || existingSlots.length === 0)) {
      const slotsToInsert: any[] = [];
      
      DAYS.forEach(day => {
        [1, 2, 3].forEach(slotNumber => {
          slotsToInsert.push({
            id: `${day}-${slotNumber}`,
            day,
            slot_number: slotNumber,
            time_range: SLOT_TIMES[slotNumber],
            capacity: 7,
            filled: 0,
          });
        });
      });

      const { error: insertSlotsError } = await supabaseAdmin
        .from('slots')
        .insert(slotsToInsert);

      if (insertSlotsError) {
        results.push(`Error seeding slots: ${insertSlotsError.message}`);
      } else {
        results.push(`Seeded ${slotsToInsert.length} slots`);
      }
    } else {
      results.push("Slots already seeded");
    }

    // 4. Ensure system_settings exists
    const { data: existingSettings } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .eq('id', 'main')
      .maybeSingle();

    if (!existingSettings) {
      const { error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .insert({ id: 'main', is_system_locked: false });

      if (settingsError) {
        results.push(`Error creating system settings: ${settingsError.message}`);
      } else {
        results.push("System settings created");
      }
    } else {
      results.push("System settings already exist");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        admin_credentials: {
          email: adminEmail,
          password: "Sixphrase@123",
          note: "Change password after first login"
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Seed error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
