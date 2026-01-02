import { TimeSlot, SlotSelection, SLOT_TIMES, SlotNumber } from '@/lib/slotData';
import { cn } from '@/lib/utils';
import { CalendarClock, Check, Circle } from 'lucide-react';

interface SelectionSummaryProps {
  selections: SlotSelection;
  slots: TimeSlot[];
  department?: string | null;
  year?: string | null;
}

const SelectionSummary = ({ selections, slots, department, year }: SelectionSummaryProps) => {
  const getSlotDetails = (slotId: string | null) => {
    if (!slotId) return null;
    return slots.find((s) => `${s.day}-${s.slotNumber}` === slotId);
  };

  const slotEntries: { key: keyof SlotSelection; label: string }[] = [
    { key: 'slot1', label: 'First Slot' },
    { key: 'slot2', label: 'Second Slot' },
    { key: 'slot3', label: 'Third Slot' },
  ];

  const selectedCount = [selections.slot1, selections.slot2, selections.slot3].filter(Boolean).length;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Selection Summary</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {selectedCount}/3 Selected
        </span>
      </div>

      {(department || year) && (
        <div className="mb-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            {year && <span className="font-medium text-foreground">{year} Year</span>}
            {year && department && ' • '}
            {department && <span className="font-medium text-foreground">{department}</span>}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {slotEntries.map(({ key, label }) => {
          const slot = getSlotDetails(selections[key]);
          const isSelected = !!slot;

          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-all',
                isSelected ? 'border-accent/30 bg-accent/5' : 'border-border bg-muted/30'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                {slot ? (
                  <p className="text-sm font-medium text-foreground">
                    {slot.day} • {SLOT_TIMES[slot.slotNumber as SlotNumber]}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not selected</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectionSummary;
