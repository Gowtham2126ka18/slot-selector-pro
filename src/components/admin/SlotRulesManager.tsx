import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, GitBranch, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DAYS, SLOT_TIMES, Day, SlotNumber } from '@/lib/slotData';

interface SlotRule {
  id: string;
  slot1_day: string;
  slot1_number: number;
  slot2_day: string;
  slot2_number: number;
  slot3_day: string;
  slot3_number: number;
  created_at: string;
}

const SLOT_NUMBERS: SlotNumber[] = [1, 2, 3];

const SlotRulesManager = () => {
  const [rules, setRules] = useState<SlotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [slot1Day, setSlot1Day] = useState<string>('');
  const [slot1Number, setSlot1Number] = useState<string>('');
  const [slot2Day, setSlot2Day] = useState<string>('');
  const [slot2Number, setSlot2Number] = useState<string>('');
  const [slot3Day, setSlot3Day] = useState<string>('');
  const [slot3Number, setSlot3Number] = useState<string>('');

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('slot_dependency_rules')
        .select('*')
        .order('slot1_day')
        .order('slot1_number')
        .order('slot2_day')
        .order('slot2_number');

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRules();
    setRefreshing(false);
  };

  const resetForm = () => {
    setSlot1Day('');
    setSlot1Number('');
    setSlot2Day('');
    setSlot2Number('');
    setSlot3Day('');
    setSlot3Number('');
  };

  const handleCreateRule = async () => {
    if (!slot1Day || !slot1Number || !slot2Day || !slot2Number || !slot3Day || !slot3Number) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all slot selections',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase.from('slot_dependency_rules').insert({
        slot1_day: slot1Day,
        slot1_number: parseInt(slot1Number),
        slot2_day: slot2Day,
        slot2_number: parseInt(slot2Number),
        slot3_day: slot3Day,
        slot3_number: parseInt(slot3Number),
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('This rule combination already exists');
        }
        throw error;
      }

      toast({
        title: 'Rule Created',
        description: 'Slot dependency rule has been added successfully',
      });

      setDialogOpen(false);
      resetForm();
      await fetchRules();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create rule',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from('slot_dependency_rules').delete().eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Rule Deleted',
        description: 'Slot dependency rule has been removed',
      });

      await fetchRules();
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  const formatSlot = (day: string, number: number) => {
    return `${day} Slot ${number} (${SLOT_TIMES[number as SlotNumber]})`;
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading rules...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Slot Dependency Rules
            </CardTitle>
            <CardDescription>
              Define valid slot combinations (Slot 1 → Slot 2 → Slot 3)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Add Slot Dependency Rule
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Define a valid path: If Slot 1 is X, then Slot 2 must be Y, and Slot 3 must be Z.
                    </AlertDescription>
                  </Alert>

                  {/* Slot 1 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Slot 1 (Starting)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={slot1Day} onValueChange={setSlot1Day}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={slot1Number} onValueChange={setSlot1Number}>
                        <SelectTrigger>
                          <SelectValue placeholder="Slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_NUMBERS.map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              Slot {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Slot 2 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Slot 2 (Required)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={slot2Day} onValueChange={setSlot2Day}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={slot2Number} onValueChange={setSlot2Number}>
                        <SelectTrigger>
                          <SelectValue placeholder="Slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_NUMBERS.map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              Slot {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Slot 3 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Slot 3 (Mandatory)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={slot3Day} onValueChange={setSlot3Day}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={slot3Number} onValueChange={setSlot3Number}>
                        <SelectTrigger>
                          <SelectValue placeholder="Slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_NUMBERS.map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              Slot {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateRule} className="w-full" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Rule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="py-12 text-center">
            <GitBranch className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No slot dependency rules configured</p>
            <p className="text-sm text-muted-foreground/70">
              Add rules to enforce valid slot combinations
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot 1</TableHead>
                  <TableHead>→</TableHead>
                  <TableHead>Slot 2</TableHead>
                  <TableHead>→</TableHead>
                  <TableHead>Slot 3</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.slot1_day} S{rule.slot1_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">→</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {rule.slot2_day} S{rule.slot2_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">→</TableCell>
                    <TableCell>
                      <Badge className="bg-primary">
                        {rule.slot3_day} S{rule.slot3_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this slot dependency rule. Existing submissions will not be affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRule(rule.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlotRulesManager;
