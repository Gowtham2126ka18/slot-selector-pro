import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, RefreshCw, FolderPlus, Layers } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  year: string;
}

interface Section {
  id: string;
  department_id: string;
  name: string;
  year: string;
  created_at: string;
  departments?: Department;
}

const SectionManager = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Form state
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [sectionName, setSectionName] = useState('');
  const [sectionYear, setSectionYear] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [deptResult, sectResult] = await Promise.all([
        supabase.from('departments').select('*').order('year').order('name'),
        supabase.from('sections').select('*, departments(id, name, year)').order('created_at', { ascending: false }),
      ]);

      if (deptResult.data) setDepartments(deptResult.data);
      if (sectResult.data) setSections(sectResult.data as Section[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCreateSection = async () => {
    const trimmedName = sectionName.trim();
    
    // Input validation
    if (!selectedDepartment || !trimmedName || !sectionYear) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate section name format and length
    if (trimmedName.length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Section name must be 100 characters or less',
        variant: 'destructive',
      });
      return;
    }

    // Only allow alphanumeric, spaces, and hyphens
    const validNamePattern = /^[A-Za-z0-9 \-]+$/;
    if (!validNamePattern.test(trimmedName)) {
      toast({
        title: 'Validation Error',
        description: 'Section name can only contain letters, numbers, spaces, and hyphens',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase.from('sections').insert({
        department_id: selectedDepartment,
        name: trimmedName,
        year: sectionYear,
      });

      if (error) throw error;

      toast({
        title: 'Section Created',
        description: `${sectionName} has been added successfully`,
      });

      setDialogOpen(false);
      setSelectedDepartment('');
      setSectionName('');
      setSectionYear('');
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create section',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    try {
      const { error } = await supabase.from('sections').delete().eq('id', sectionId);

      if (error) throw error;

      toast({
        title: 'Section Deleted',
        description: `${sectionName} has been removed`,
      });

      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete section',
        variant: 'destructive',
      });
    }
  };

  // Get unique department for display
  const getDepartmentInfo = (section: Section) => {
    return section.departments || departments.find((d) => d.id === section.department_id);
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading sections...</div>
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
              <Layers className="h-5 w-5" />
              Section Management
            </CardTitle>
            <CardDescription>
              Configure sections for departments (e.g., CSE GEN A, B, C, D)
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
                  Add Section
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderPlus className="h-5 w-5" />
                    Add New Section
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectionName">Section Name</Label>
                    <Input
                      id="sectionName"
                      placeholder="e.g., Section A, CSE GEN A"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Academic Year</Label>
                    <Select value={sectionYear} onValueChange={setSectionYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCreateSection} 
                    className="w-full" 
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Section'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="py-12 text-center">
            <Layers className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No sections configured yet</p>
            <p className="text-sm text-muted-foreground/70">
              Add sections for departments that have multiple classes
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => {
                const dept = getDepartmentInfo(section);
                return (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dept?.name || 'Unknown'}</Badge>
                    </TableCell>
                    <TableCell>{section.year}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(section.created_at).toLocaleDateString()}
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
                            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{section.name}" and all associated submissions. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSection(section.id, section.name)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionManager;
