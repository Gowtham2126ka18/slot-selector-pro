import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, User, Shield, ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const authSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Check user role and redirect appropriately
  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (user && !loading) {
        // Check if admin
        if (isAdmin) {
          navigate('/admin');
          return;
        }

        // Check if department head
        const { data: dhCredentials } = await supabase
          .from('department_head_credentials')
          .select('id, is_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dhCredentials && dhCredentials.is_enabled) {
          navigate('/department-dashboard');
          return;
        }

        // If neither admin nor department head, show access denied
        toast({
          title: 'Access Denied',
          description: 'Your account does not have the required permissions.',
          variant: 'destructive',
        });
      }
    };

    checkUserRoleAndRedirect();
  }, [user, isAdmin, loading, navigate, toast]);

  const validateForm = () => {
    try {
      authSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { username?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'username') fieldErrors.username = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Convert username to email format for Supabase auth
    const email = `${formData.username.toLowerCase().trim()}@admin.local`;
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: formData.password,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid username or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      // Redirect happens in useEffect after user state updates
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Link 
        to="/" 
        className="absolute left-4 top-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Slot Allocation Portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure access for Admins and Department Heads
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-10"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-md w-full">
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">Full system control and management</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
          <Building2 className="h-5 w-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium">Department Head</p>
            <p className="text-xs text-muted-foreground">Select slots for your department</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Credentials are provided by the system administrator.
      </p>
    </div>
  );
};

export default Auth;
