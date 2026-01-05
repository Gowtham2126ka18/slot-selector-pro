import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSlotManagement } from '@/hooks/useSlotManagement';
import Header from '@/components/Header';
import DepartmentHeadManager from '@/components/DepartmentHeadManager';
import SectionManager from '@/components/admin/SectionManager';
import SlotRulesInfo from '@/components/admin/SlotRulesInfo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  DAYS,
  SLOT_TIMES,
  SlotNumber,
  SECOND_YEAR_DEPARTMENTS,
  THIRD_YEAR_DEPARTMENTS,
} from '@/lib/slotData';
import {
  Users,
  Calendar,
  BarChart3,
  Download,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  Building2,
  TrendingUp,
  LogOut,
  Shield,
  RefreshCw,
  UserCog,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const {
    slots,
    submissions,
    systemSettings,
    loading: dataLoading,
    clearAllSubmissions,
    resetAllSlots,
    deleteSubmission,
    toggleSystemLock,
    refreshData,
  } = useSlotManagement();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user && !isAdmin) {
      // Non-admin users should be redirected
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getSlotStatus = (filled: number, capacity: number) => {
    const remaining = capacity - filled;
    if (remaining === 0) return 'full';
    if (remaining <= 2) return 'limited';
    return 'available';
  };

  const getStatusBadgeVariant = (status: 'available' | 'limited' | 'full') => {
    const variants: Record<typeof status, 'default' | 'secondary' | 'destructive'> = {
      available: 'default',
      limited: 'secondary',
      full: 'destructive',
    };
    return variants[status];
  };

  const stats = {
    totalDepartments: SECOND_YEAR_DEPARTMENTS.length + THIRD_YEAR_DEPARTMENTS.length,
    submittedCount: submissions.length,
    pendingCount:
      SECOND_YEAR_DEPARTMENTS.length +
      THIRD_YEAR_DEPARTMENTS.length -
      submissions.length,
    averageCapacity: slots.length > 0
      ? Math.round(
          (slots.reduce((acc, s) => acc + s.filled, 0) /
            slots.reduce((acc, s) => acc + s.capacity, 0)) *
            100
        )
      : 0,
  };

  const exportToCSV = () => {
    const headers = ['Department', 'Year', 'Slot 1', 'Slot 2', 'Slot 3', 'Submitted At'];
    const rows = submissions.map((s) => [
      s.departments?.name || 'Unknown',
      s.departments?.year || 'Unknown',
      s.slot1_id,
      s.slot2_id,
      s.slot3_id,
      new Date(s.submitted_at).toLocaleString(),
    ]);
    
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `slot-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Admin Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              {isAdmin && (
                <Badge className="bg-primary/20 text-primary">
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email} • Manage slot allocations and submissions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm"
                  variant={systemSettings.is_system_locked ? 'default' : 'destructive'}
                >
                  {systemSettings.is_system_locked ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unlock System
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock System
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {systemSettings.is_system_locked ? 'Unlock System?' : 'Lock System?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {systemSettings.is_system_locked
                      ? 'This will allow departments to submit slot selections again.'
                      : 'This will prevent any new slot submissions. Existing submissions will be preserved.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleSystemLock}>
                    {systemSettings.is_system_locked ? 'Unlock' : 'Lock'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* System Status Banner */}
        {systemSettings.is_system_locked && (
          <div className="mb-6 rounded-lg border border-warning/50 bg-warning/10 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-warning" />
              <span className="font-medium text-warning">System is Locked</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              New submissions are currently disabled. Click "Unlock System" to allow submissions.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Departments
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">
                2nd: {SECOND_YEAR_DEPARTMENTS.length} • 3rd: {THIRD_YEAR_DEPARTMENTS.length}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submissions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.submittedCount}</div>
              <Progress
                value={(stats.submittedCount / stats.totalDepartments) * 100}
                className="mt-2 h-1.5"
              />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting slot selection</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Capacity Used
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCapacity}%</div>
              <Progress value={stats.averageCapacity} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="mb-8 border-destructive/20 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Admin Controls</CardTitle>
            <CardDescription>
              Destructive actions - use with caution. These cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Submissions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Submissions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL department submissions and reset all slot counts to 0. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllSubmissions}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Slot Counts
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Slot Counts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all slot filled counts to 0. Submissions will remain but slot capacity will be recalculated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetAllSlots}>Reset Counts</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Slot Overview
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Users className="h-4 w-4" />
              Submissions ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="department-heads" className="gap-2">
              <UserCog className="h-4 w-4" />
              Dept Heads
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-2">
              <Layers className="h-4 w-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Slot Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-fade-in">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Slot Utilization Grid</CardTitle>
                <CardDescription>
                  Real-time view of slot capacity across all days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Time</TableHead>
                        {DAYS.map((day) => (
                          <TableHead key={day} className="text-center min-w-[100px]">
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {([1, 2, 3] as SlotNumber[]).map((slotNumber) => (
                        <TableRow key={slotNumber}>
                          <TableCell className="font-medium">
                            <div className="text-xs">
                              <div className="font-semibold">Slot {slotNumber}</div>
                              <div className="text-muted-foreground">{SLOT_TIMES[slotNumber]}</div>
                            </div>
                          </TableCell>
                          {DAYS.map((day) => {
                            const slot = slots.find(
                              (s) => s.day === day && s.slot_number === slotNumber
                            );
                            if (!slot) {
                              return (
                                <TableCell key={day} className="text-center">
                                  <span className="text-muted-foreground">-</span>
                                </TableCell>
                              );
                            }
                            const status = getSlotStatus(slot.filled, slot.capacity);
                            return (
                              <TableCell key={day} className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                                    {slot.filled}/{slot.capacity}
                                  </Badge>
                                  <span className="text-[10px] capitalize text-muted-foreground">
                                    {status}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="animate-fade-in">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Department Submissions</CardTitle>
                <CardDescription>
                  All submitted slot allocations from departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>No submissions yet</p>
                    <p className="text-sm">Submissions will appear here once departments submit their slot selections</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Slot 1</TableHead>
                        <TableHead>Slot 2</TableHead>
                        <TableHead>Slot 3</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">
                            {submission.departments?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{submission.departments?.year || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {submission.slot1_id}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {submission.slot2_id}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {submission.slot3_id}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(submission.submitted_at).toLocaleDateString()}
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
                                  <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the submission from {submission.departments?.name}. The slot counts will be updated automatically.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSubmission(submission.id)}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="department-heads" className="animate-fade-in">
            <DepartmentHeadManager />
          </TabsContent>

          <TabsContent value="sections" className="animate-fade-in">
            <SectionManager />
          </TabsContent>

          <TabsContent value="rules" className="animate-fade-in">
            <SlotRulesInfo />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
