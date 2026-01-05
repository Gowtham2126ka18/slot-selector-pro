import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Calendar,
  Clock,
} from 'lucide-react';

const SlotRulesInfo = () => {
  // Example flow for Monday Slot 1
  const exampleFlow = {
    slot1: { day: 'Monday', slot: 1 },
    slot2Options: [
      { day: 'Wednesday', slot: 2, slot3: { day: 'Friday', slot: 3 } },
      { day: 'Wednesday', slot: 3, slot3: { day: 'Friday', slot: 2 } },
    ],
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <CardTitle>Slot Dependency Rules</CardTitle>
        </div>
        <CardDescription>
          Automatic algorithmic rule system - no manual configuration required
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            Slot dependencies are calculated automatically using a cyclic +2 day pattern. 
            No manual rule configuration is needed.
          </AlertDescription>
        </Alert>

        {/* Rule Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Day Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Slot 1</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Any day</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Slot 2</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Slot 1 day + 2 days</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Slot 3</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Slot 2 day + 2 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Slot 2</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Different time from Slot 1</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Slot 3</Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Remaining time slot</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                All 3 slots use different time periods (1, 2, 3)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example Flow */}
        <Card className="border-muted bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Example: {exampleFlow.slot1.day} Slot {exampleFlow.slot1.slot}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary">Slot 1</Badge>
                <span className="font-medium">{exampleFlow.slot1.day} Slot {exampleFlow.slot1.slot}</span>
                <span className="text-xs text-muted-foreground">(8:45 – 10:00)</span>
              </div>
              
              <div className="ml-4 border-l-2 border-dashed border-muted-foreground/30 pl-4 space-y-3">
                {exampleFlow.slot2Options.map((opt, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Slot 2 Option {i + 1}</Badge>
                      <span className="font-medium">{opt.day} Slot {opt.slot}</span>
                    </div>
                    <div className="ml-6 flex items-center gap-3">
                      <ArrowRight className="h-4 w-4 text-accent" />
                      <Badge variant="outline" className="border-accent text-accent">Slot 3</Badge>
                      <span className="font-medium">{opt.slot3.day} Slot {opt.slot3.slot}</span>
                      <span className="text-xs text-muted-foreground">(auto-assigned)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cyclic Day Reference */}
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-3 text-sm">Cyclic Day Reference (+2 days)</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { from: 'Monday', to: 'Wednesday' },
              { from: 'Tuesday', to: 'Thursday' },
              { from: 'Wednesday', to: 'Friday' },
              { from: 'Thursday', to: 'Saturday' },
              { from: 'Friday', to: 'Monday' },
              { from: 'Saturday', to: 'Tuesday' },
            ].map((pair) => (
              <div key={pair.from} className="flex items-center gap-1 rounded bg-muted px-2 py-1">
                <span>{pair.from}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-medium">{pair.to}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Fully automatic - no manual configuration needed
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Guaranteed 3 different days per section
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Balanced distribution across time slots
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Backend validation ensures rule compliance
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SlotRulesInfo;
