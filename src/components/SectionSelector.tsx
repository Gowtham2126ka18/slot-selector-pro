import { SectionWithSubmissionStatus } from '@/hooks/useSections';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FolderOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionSelectorProps {
  sections: SectionWithSubmissionStatus[];
  selectedSection: SectionWithSubmissionStatus | null;
  onSelect: (section: SectionWithSubmissionStatus) => void;
  selectedYear: string | null;
}

const SectionSelector = ({
  sections,
  selectedSection,
  onSelect,
  selectedYear,
}: SectionSelectorProps) => {
  // Filter sections by selected year if provided
  const filteredSections = selectedYear
    ? sections.filter((s) => s.year === selectedYear)
    : sections;

  if (filteredSections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
        <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          {selectedYear
            ? `No sections found for ${selectedYear}`
            : 'No sections configured for your department'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Contact the administrator to set up sections.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredSections.map((section) => {
        const isSelected = selectedSection?.id === section.id;
        const isDisabled = section.hasSubmitted;

        return (
          <Card
            key={section.id}
            className={cn(
              'cursor-pointer transition-all duration-200',
              isSelected && !isDisabled && 'ring-2 ring-primary border-primary',
              isDisabled && 'opacity-60 cursor-not-allowed bg-muted/30',
              !isSelected && !isDisabled && 'hover:border-primary/50 hover:shadow-md'
            )}
            onClick={() => !isDisabled && onSelect(section)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold text-foreground">{section.name}</h3>
                <p className="text-sm text-muted-foreground">{section.year}</p>
              </div>
              <div className="flex items-center gap-2">
                {section.hasSubmitted ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Submitted
                  </Badge>
                ) : isSelected ? (
                  <Badge className="gap-1 bg-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Selected
                  </Badge>
                ) : (
                  <Badge variant="outline">Available</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SectionSelector;
