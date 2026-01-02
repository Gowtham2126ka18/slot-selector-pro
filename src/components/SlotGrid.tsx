import { TimeSlot, DAYS, Day, SlotNumber, SLOT_TIMES } from '@/lib/slotData';
import SlotCard from './SlotCard';
import { cn } from '@/lib/utils';

interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlot?: string | null;
  disabledSlots?: string[];
  highlightedSlots?: string[];
  onSlotSelect?: (slotId: string) => void;
  compact?: boolean;
}

const SlotGrid = ({
  slots,
  selectedSlot,
  disabledSlots = [],
  highlightedSlots = [],
  onSlotSelect,
  compact = false,
}: SlotGridProps) => {
  const getSlot = (day: Day, slotNumber: SlotNumber): TimeSlot | undefined => {
    return slots.find((s) => s.day === day && s.slotNumber === slotNumber);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className={cn('min-w-[800px]', compact ? 'space-y-2' : 'space-y-3')}>
        {/* Header row */}
        <div className="grid grid-cols-7 gap-3">
          <div className="flex items-end justify-end pb-2 pr-2">
            <span className="text-xs font-medium text-muted-foreground">Time / Day</span>
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex items-center justify-center rounded-lg bg-primary/5 py-3"
            >
              <span className="text-sm font-semibold text-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Slot rows */}
        {([1, 2, 3] as SlotNumber[]).map((slotNumber) => (
          <div key={slotNumber} className="grid grid-cols-7 gap-3">
            <div className="flex flex-col items-end justify-center pr-2 text-right">
              <span className="text-xs font-semibold text-primary">
                Slot {slotNumber}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {SLOT_TIMES[slotNumber]}
              </span>
            </div>
            {DAYS.map((day) => {
              const slot = getSlot(day, slotNumber);
              if (!slot) return <div key={day} />;

              const slotId = `${day}-${slotNumber}`;
              const isSelected = selectedSlot === slotId;
              const isDisabled = disabledSlots.includes(slotId);
              const isHighlighted = highlightedSlots.includes(slotId);

              return (
                <SlotCard
                  key={slotId}
                  slot={slot}
                  isSelected={isSelected}
                  isDisabled={isDisabled}
                  isHighlighted={isHighlighted}
                  onClick={() => onSlotSelect?.(slotId)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotGrid;
