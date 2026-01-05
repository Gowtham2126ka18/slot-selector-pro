import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartmentHeadManagement } from '@/hooks/useDepartmentHeadManagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Trash2, RefreshCw, Users, Eye, EyeOff, Settings } from 'lucide-react';
import { z } from 'zod';

const createDepartmentHeadSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department_ids: z.array(z.string().uuid()).min(1, 'Please select at least one department'),
});

const DepartmentHeadManager = () => {
  const navigate = useNavigate();
  const {
    departmentHeads,
    departments,
    loading,
    createDepartmentHead,
    toggleDepartmentHeadStatus,
    deleteDepartmentHead,
    getUnassignedDepartments,
    refreshData,
  } = useDepartmentHeadManagement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    department_ids: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasDepartments = departments.length > 0;
  const canAddDepartmentHead = hasDepartments && departments.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const validateForm = () => {
    try {
      createDepartmentHeadSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    const success = await createDepartmentHead({
      email: formData.email,
      password: formData.password,
      department_ids: formData.department_ids,
    });
    setIsCreating(false);

    if (success) {
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', department_ids: [] });
      setErrors({});
    }
  };

  const handleDepartmentToggle = (deptId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: checked 
        ? [...prev.department_ids, deptId]
        : prev.department_ids.filter((id) => id !== deptId),
    }));
  };

  // Group departments by year for better UX
  const departmentsByYear = departments.reduce((acc, dept) => {
    if (!acc[dept.year]) acc[dept.year] = [];
    acc[dept.year].push(dept);
    return acc;
  }, {} as Record<string, typeof departments>);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Head Management
            </CardTitle>
            <CardDescription>
              Create, enable/disable, and manage department head accounts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {!hasDepartments && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/setup')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Run Setup
              </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canAddDepartmentHead}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Department Head
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Department Head Account</DialogTitle>
                  <DialogDescription>
                    Create login credentials for a department head. They will use these credentials to access the slot selection portal.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Departments</Label>
                    <p className="text-sm text-muted-foreground">
                      Select the departments this head can manage
                    </p>
                    <ScrollArea className={`h-48 rounded-md border p-3 ${errors.department_ids ? 'border-destructive' : ''}`}>
                      {Object.entries(departmentsByYear).map(([year, depts]) => (
                        <div key={year} className="mb-4 last:mb-0">
                          <p className="mb-2 text-sm font-medium text-muted-foreground">{year} Year</p>
                          <div className="space-y-2">
                            {depts.map((dept) => (
                              <div key={dept.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={dept.id}
                                  checked={formData.department_ids.includes(dept.id)}
                                  onCheckedChange={(checked) => 
                                    handleDepartmentToggle(dept.id, checked === true)
                                  }
                                />
                                <label
                                  htmlFor={dept.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {dept.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    {errors.department_ids && (
                      <p className="text-sm text-destructive">{errors.department_ids}</p>
                    )}
                    {formData.department_ids.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formData.department_ids.length} department(s) selected
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="department.head@example.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Minimum 8 characters"
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Account'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading department heads...
          </div>
        ) : departmentHeads.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No department heads created yet</p>
            <p className="text-sm">Create department head accounts to allow slot selection</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentHeads.map((dh) => (
                <TableRow key={dh.id}>
                  <TableCell className="font-medium">
                    {dh.department?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dh.department?.year || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dh.is_enabled}
                        onCheckedChange={() => toggleDepartmentHeadStatus(dh.id, dh.is_enabled)}
                      />
                      <span className={dh.is_enabled ? 'text-accent' : 'text-muted-foreground'}>
                        {dh.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(dh.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department Head?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the department head credentials for {dh.department?.name}. They will no longer be able to access the portal.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDepartmentHead(dh.id, dh.user_id)}
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
        )}

        {!hasDepartments ? (
          <div className="mt-4 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
            <p className="font-medium text-warning">No departments found.</p>
            <p className="mt-1 text-muted-foreground">
              Run setup to seed departments and slots, then you can create department head login credentials.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DepartmentHeadManager;
