import { useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  generateSlots,
  getSlotStatus,
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
  Eye,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Mock submitted departments for demo
const mockSubmissions = [
  { department: 'Computer Science', year: '2nd', slot1: 'Monday-1', slot2: 'Wednesday-2', slot3: 'Friday-3', submittedAt: '2024-01-15 09:30' },
  { department: 'Electronics & Communication', year: '2nd', slot1: 'Tuesday-2', slot2: 'Wednesday-1', slot3: 'Saturday-1', submittedAt: '2024-01-15 10:15' },
  { department: 'Mechanical Engineering', year: '3rd', slot1: 'Monday-2', slot2: 'Wednesday-1', slot3: 'Saturday-2', submittedAt: '2024-01-15 11:00' },
  { department: 'Civil Engineering', year: '2nd', slot1: 'Wednesday-1', slot2: 'Friday-2', slot3: 'Saturday-1', submittedAt: '2024-01-15 14:20' },
  { department: 'Information Technology', year: '3rd', slot1: 'Thursday-1', slot2: 'Friday-2', slot3: 'Saturday-3', submittedAt: '2024-01-15 15:45' },
];

const Admin = () => {
  const slots = useMemo(() => generateSlots(), []);

  const stats = {
    totalDepartments: SECOND_YEAR_DEPARTMENTS.length + THIRD_YEAR_DEPARTMENTS.length,
    submittedCount: mockSubmissions.length,
    pendingCount:
      SECOND_YEAR_DEPARTMENTS.length +
      THIRD_YEAR_DEPARTMENTS.length -
      mockSubmissions.length,
    averageCapacity: Math.round(
      (slots.reduce((acc, s) => acc + s.filled, 0) /
        slots.reduce((acc, s) => acc + s.capacity, 0)) *
        100
    ),
  };

  const getStatusBadge = (status: 'available' | 'limited' | 'full') => {
    const variants: Record<typeof status, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      available: { variant: 'default', label: 'Available' },
      limited: { variant: 'secondary', label: 'Limited' },
      full: { variant: 'destructive', label: 'Full' },
    };
    return variants[status];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage slot allocations and view department submissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button className="gap-2 bg-destructive hover:bg-destructive/90">
              <Lock className="h-4 w-4" />
              Lock System
            </Button>
          </div>
        </div>

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
                2nd Year: {SECOND_YEAR_DEPARTMENTS.length} • 3rd Year:{' '}
                {THIRD_YEAR_DEPARTMENTS.length}
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
              <div className="text-2xl font-bold text-accent">
                {stats.submittedCount}
              </div>
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
              <div className="text-2xl font-bold text-warning">
                {stats.pendingCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting slot selection
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Capacity Used
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCapacity}%</div>
              <Progress value={stats.averageCapacity} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Slot Overview
            </TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2">
              <Users className="h-4 w-4" />
              Submissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-fade-in">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Slot Utilization Grid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        {DAYS.map((day) => (
                          <TableHead key={day} className="text-center">
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
                              <div className="text-muted-foreground">
                                {SLOT_TIMES[slotNumber]}
                              </div>
                            </div>
                          </TableCell>
                          {DAYS.map((day) => {
                            const slot = slots.find(
                              (s) => s.day === day && s.slotNumber === slotNumber
                            );
                            if (!slot) return <TableCell key={day} />;
                            const status = getSlotStatus(slot);
                            const badge = getStatusBadge(status);
                            return (
                              <TableCell key={day} className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant={badge.variant} className="text-xs">
                                    {slot.filled}/{slot.capacity}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {badge.label}
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
              </CardHeader>
              <CardContent>
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
                    {mockSubmissions.map((submission, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {submission.department}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{submission.year}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.slot1}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.slot2}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.slot3}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.submittedAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
