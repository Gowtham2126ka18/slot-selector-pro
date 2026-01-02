import { Year, SECOND_YEAR_DEPARTMENTS, THIRD_YEAR_DEPARTMENTS } from '@/lib/slotData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, GraduationCap } from 'lucide-react';

interface DepartmentSelectorProps {
  selectedYear: Year | null;
  selectedDepartment: string | null;
  onYearChange: (year: Year) => void;
  onDepartmentChange: (department: string) => void;
}

const DepartmentSelector = ({
  selectedYear,
  selectedDepartment,
  onYearChange,
  onDepartmentChange,
}: DepartmentSelectorProps) => {
  const departments = selectedYear === '2nd' 
    ? SECOND_YEAR_DEPARTMENTS 
    : selectedYear === '3rd'
    ? THIRD_YEAR_DEPARTMENTS
    : [];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          Academic Year
        </Label>
        <Select
          value={selectedYear || ''}
          onValueChange={(value) => onYearChange(value as Year)}
        >
          <SelectTrigger className="h-12 bg-card">
            <SelectValue placeholder="Select academic year" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="2nd">2nd Year (20 Departments)</SelectItem>
            <SelectItem value="3rd">3rd Year (18 Departments)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Department
        </Label>
        <Select
          value={selectedDepartment || ''}
          onValueChange={onDepartmentChange}
          disabled={!selectedYear}
        >
          <SelectTrigger className="h-12 bg-card">
            <SelectValue placeholder={selectedYear ? 'Select your department' : 'First select year'} />
          </SelectTrigger>
          <SelectContent className="max-h-[280px] bg-popover">
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DepartmentSelector;
