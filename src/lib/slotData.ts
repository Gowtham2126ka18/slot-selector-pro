// Slot system data and types

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type SlotNumber = 1 | 2 | 3;
export type Year = '2nd' | '3rd';

export interface TimeSlot {
  id: string;
  day: Day;
  slotNumber: SlotNumber;
  time: string;
  capacity: number;
  filled: number;
}

export interface SlotSelection {
  slot1: string | null;
  slot2: string | null;
  slot3: string | null;
}

export interface Department {
  id: string;
  name: string;
  year: Year;
  hasSubmitted: boolean;
  selections?: SlotSelection;
}

// Days of the week
export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Slot times
export const SLOT_TIMES: Record<SlotNumber, string> = {
  1: '8:45 AM – 10:00 AM',
  2: '11:00 AM – 1:00 PM',
  3: '2:00 PM – 3:45 PM',
};

// Maximum capacity per slot
export const MAX_CAPACITY = 7;

// Generate all slots
export const generateSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  DAYS.forEach((day) => {
    ([1, 2, 3] as SlotNumber[]).forEach((slotNumber) => {
      slots.push({
        id: `${day}-${slotNumber}`,
        day,
        slotNumber,
        time: SLOT_TIMES[slotNumber],
        capacity: MAX_CAPACITY,
        filled: Math.floor(Math.random() * 5), // Mock data
      });
    });
  });
  return slots;
};

// 2nd Year Departments (20)
export const SECOND_YEAR_DEPARTMENTS: string[] = [
  'CSE GEN A',
  'CSE GEN B',
  'CSE STAR A',
  'CSE STAR B',
  'CSE STAR C',
  'CTIS & CTMA',
  'AI',
  'BCT & CPS',
  'IOT',
  'SE',
  'Cyber security',
  'AIML A',
  'AIML B',
  'AIML C',
  'AIML D',
  'Data Science',
  'AIDE',
  'CSBS',
  'ISE',
  'AI Dev ops',
];

// 3rd Year Departments (18)
export const THIRD_YEAR_DEPARTMENTS: string[] = [
  'CSE GEN A',
  'CSE GEN B',
  'CSE STAR A',
  'CSE STAR B',
  'CSE STAR C',
  'CTIS & CTMA',
  'AI',
  'IOT',
  'SE',
  'Cyber security',
  'AIML A',
  'AIML B',
  'AIML C',
  'AIML D',
  'Data Science',
  'AIDE',
  'CSBS',
  'ISE',
];

// Slot dependency rules
// Format: If Slot1 is X, then Slot2 must be from Y[], and Slot3 must be from Z[]
export interface DependencyRule {
  slot1: string;
  allowedSlot2: string[];
  allowedSlot3: string[];
}

export const SLOT_DEPENDENCY_RULES: DependencyRule[] = [
  {
    slot1: 'Monday-1',
    allowedSlot2: ['Wednesday-2', 'Wednesday-3'],
    allowedSlot3: ['Friday-3'],
  },
  {
    slot1: 'Monday-2',
    allowedSlot2: ['Wednesday-1', 'Thursday-2'],
    allowedSlot3: ['Saturday-1', 'Saturday-2'],
  },
  {
    slot1: 'Monday-3',
    allowedSlot2: ['Tuesday-2', 'Thursday-1'],
    allowedSlot3: ['Friday-1', 'Friday-2'],
  },
  {
    slot1: 'Tuesday-1',
    allowedSlot2: ['Thursday-2', 'Thursday-3'],
    allowedSlot3: ['Saturday-2', 'Saturday-3'],
  },
  {
    slot1: 'Tuesday-2',
    allowedSlot2: ['Wednesday-1', 'Friday-2'],
    allowedSlot3: ['Saturday-1'],
  },
  {
    slot1: 'Tuesday-3',
    allowedSlot2: ['Thursday-1', 'Friday-1'],
    allowedSlot3: ['Saturday-2', 'Saturday-3'],
  },
  {
    slot1: 'Wednesday-1',
    allowedSlot2: ['Friday-2', 'Friday-3'],
    allowedSlot3: ['Saturday-1', 'Saturday-2'],
  },
  {
    slot1: 'Wednesday-2',
    allowedSlot2: ['Thursday-1', 'Thursday-3'],
    allowedSlot3: ['Saturday-3'],
  },
  {
    slot1: 'Wednesday-3',
    allowedSlot2: ['Friday-1', 'Friday-2'],
    allowedSlot3: ['Saturday-1'],
  },
  {
    slot1: 'Thursday-1',
    allowedSlot2: ['Friday-2', 'Saturday-1'],
    allowedSlot3: ['Saturday-3'],
  },
  {
    slot1: 'Thursday-2',
    allowedSlot2: ['Friday-1', 'Friday-3'],
    allowedSlot3: ['Saturday-2'],
  },
  {
    slot1: 'Thursday-3',
    allowedSlot2: ['Friday-1', 'Saturday-2'],
    allowedSlot3: ['Saturday-3'],
  },
  {
    slot1: 'Friday-1',
    allowedSlot2: ['Saturday-2', 'Saturday-3'],
    allowedSlot3: ['Monday-2', 'Monday-3'],
  },
  {
    slot1: 'Friday-2',
    allowedSlot2: ['Saturday-1', 'Saturday-3'],
    allowedSlot3: ['Monday-1', 'Tuesday-1'],
  },
  {
    slot1: 'Friday-3',
    allowedSlot2: ['Saturday-1', 'Saturday-2'],
    allowedSlot3: ['Monday-2', 'Tuesday-2'],
  },
  {
    slot1: 'Saturday-1',
    allowedSlot2: ['Monday-2', 'Monday-3'],
    allowedSlot3: ['Wednesday-1', 'Wednesday-2'],
  },
  {
    slot1: 'Saturday-2',
    allowedSlot2: ['Monday-1', 'Tuesday-2'],
    allowedSlot3: ['Thursday-1', 'Thursday-2'],
  },
  {
    slot1: 'Saturday-3',
    allowedSlot2: ['Monday-1', 'Tuesday-1'],
    allowedSlot3: ['Wednesday-3', 'Thursday-3'],
  },
];

export const getDependencyRule = (slot1Id: string): DependencyRule | undefined => {
  return SLOT_DEPENDENCY_RULES.find((rule) => rule.slot1 === slot1Id);
};

export const getSlotStatus = (slot: TimeSlot): 'available' | 'limited' | 'full' => {
  const remaining = slot.capacity - slot.filled;
  if (remaining === 0) return 'full';
  if (remaining <= 2) return 'limited';
  return 'available';
};
