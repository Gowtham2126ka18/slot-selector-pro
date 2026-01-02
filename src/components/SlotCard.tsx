import { cn } from '@/lib/utils';
import { TimeSlot, getSlotStatus, SLOT_TIMES } from '@/lib/slotData';
import { Check, Users } from 'lucide-react';

interface SlotCardProps {
  slot: TimeSlot;
  isSelected?: boolean;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const SlotCard = ({
  slot,
  isSelected = false,
  isDisabled = false,
  isHighlighted = false,
  onClick,
}: SlotCardProps) => {
  const status = getSlotStatus(slot);
  const remaining = slot.capacity - slot.filled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || status === 'full'}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        {
          // Selected state
          'border-accent bg-accent/10 shadow-card-hover': isSelected,
          // Available state
          'border-slot-available/30 bg-card hover:border-slot-available hover:shadow-card':
            !isSelected && !isDisabled && status === 'available',
          // Limited state
          'border-slot-limited/30 bg-card hover:border-slot-limited hover:shadow-card':
            !isSelected && !isDisabled && status === 'limited',
          // Full state
          'cursor-not-allowed border-slot-full/20 bg-muted/50 opacity-60':
            status === 'full',
          // Disabled but not full
          'cursor-not-allowed border-border bg-muted/30 opacity-50':
            isDisabled && status !== 'full',
          // Highlighted (valid selection)
          'ring-2 ring-accent ring-offset-2': isHighlighted && !isSelected,
        }
      )}
    >
      {isSelected && (
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
          <Check className="h-3.5 w-3.5 text-accent-foreground" />
        </div>
      )}

      <div className="flex w-full items-center justify-between">
        <span
          className={cn('text-xs font-semibold uppercase tracking-wide', {
            'text-slot-available': status === 'available',
            'text-slot-limited': status === 'limited',
            'text-slot-full': status === 'full',
          })}
        >
          Slot {slot.slotNumber}
        </span>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            {
              'bg-slot-available/10 text-slot-available': status === 'available',
              'bg-slot-limited/10 text-slot-limited': status === 'limited',
              'bg-slot-full/10 text-slot-full': status === 'full',
            }
          )}
        >
          <Users className="h-3 w-3" />
          {remaining}/{slot.capacity}
        </div>
      </div>

      <span className="text-sm font-medium text-foreground">
        {SLOT_TIMES[slot.slotNumber]}
      </span>

      <div className="mt-1 flex w-full gap-1">
        {Array.from({ length: slot.capacity }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', {
              'bg-slot-available': i >= slot.filled && status === 'available',
              'bg-slot-limited': i >= slot.filled && status === 'limited',
              'bg-primary/80': i < slot.filled,
              'bg-muted': i >= slot.filled && status === 'full',
            })}
          />
        ))}
      </div>
    </button>
  );
};

export default SlotCard;
