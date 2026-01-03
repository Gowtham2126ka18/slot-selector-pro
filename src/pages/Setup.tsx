import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Database, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [seedKey, setSeedKey] = useState('sixphrase-seed-2024');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [adminCredentials, setAdminCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResults([]);
    setAdminCredentials(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-data', {
        body: { seed_key: seedKey },
      });

      if (error) {
        throw error;
      }

      setResults(data.results || []);
      if (data.admin_credentials) {
        setAdminCredentials(data.admin_credentials);
      }

      toast({
        title: 'Setup Complete',
        description: 'Initial data has been seeded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to seed initial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Initial Setup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seed the database with initial data
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Database Initialization</CardTitle>
          <CardDescription>
            This will create the initial admin user, departments, and slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seed-key">Seed Key</Label>
            <Input
              id="seed-key"
              type="password"
              value={seedKey}
              onChange={(e) => setSeedKey(e.target.value)}
              placeholder="Enter seed key"
            />
          </div>

          <Button
            onClick={handleSeed}
            disabled={loading || !seedKey}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run Setup
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium text-foreground">Results:</h3>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start gap-2 py-1">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminCredentials && (
            <Alert className="mt-4 border-primary/30 bg-primary/5">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Admin Credentials Created:</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <code className="rounded bg-muted px-1">{adminCredentials.email}</code>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Password:</span>{' '}
                    <code className="rounded bg-muted px-1">{adminCredentials.password}</code>
                  </p>
                  <p className="mt-2 text-xs text-warning">
                    ⚠️ Change this password after first login!
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {adminCredentials && (
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>

      <Alert className="mt-6 max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This setup should only be run once. If you've already set up the system, go to{' '}
          <a href="/auth" className="font-medium underline">
            Login
          </a>
          .
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Setup;
