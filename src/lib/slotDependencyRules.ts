// Slot Dependency Rules - Alternate Day Logic
// Each slot selection must be on an alternate day (skip at least 1 day)

import { Day, SlotNumber, DAYS } from './slotData';

export interface SlotId {
  day: Day;
  slotNumber: SlotNumber;
}

// Day index for calculating alternate days
const DAY_INDEX: Record<Day, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
};

/**
 * Parse a slot ID string into day and slot number
 */
export const parseSlotId = (slotId: string): SlotId | null => {
  const parts = slotId.split('-');
  if (parts.length !== 2) return null;
  
  const day = parts[0] as Day;
  const slotNumber = parseInt(parts[1]) as SlotNumber;
  
  if (!DAYS.includes(day) || ![1, 2, 3].includes(slotNumber)) {
    return null;
  }
  
  return { day, slotNumber };
};

/**
 * Get alternate days from a given day (skip at least 1 day)
 * Alternate days are: current day index + 2, +4, etc. (wrapping around if needed)
 */
export const getAlternateDays = (fromDay: Day): Day[] => {
  const fromIndex = DAY_INDEX[fromDay];
  const alternateDays: Day[] = [];
  
  // Days that are at least 2 positions away (skipping 1 day)
  for (let i = 0; i < DAYS.length; i++) {
    const dayDiff = Math.abs(i - fromIndex);
    // Consider wrapping: the minimum distance is either direct or wrapped
    const wrappedDiff = Math.min(dayDiff, DAYS.length - dayDiff);
    
    // Skip at least 1 day means minimum distance of 2
    if (wrappedDiff >= 2) {
      alternateDays.push(DAYS[i]);
    }
  }
  
  return alternateDays;
};

/**
 * Get all allowed slot IDs for Slot 2 based on Slot 1 selection
 * Rule: Slot 2 must be on an alternate day from Slot 1
 */
export const getAllowedSlot2Options = (slot1Id: string): string[] => {
  const slot1 = parseSlotId(slot1Id);
  if (!slot1) return [];
  
  const alternateDays = getAlternateDays(slot1.day);
  const options: string[] = [];
  
  alternateDays.forEach((day) => {
    ([1, 2, 3] as SlotNumber[]).forEach((slotNum) => {
      options.push(`${day}-${slotNum}`);
    });
  });
  
  return options;
};

/**
 * Get all allowed slot IDs for Slot 3 based on Slot 1 and Slot 2 selection
 * Rule: Slot 3 must be on an alternate day from Slot 2 AND different from Slot 1
 */
export const getAllowedSlot3Options = (slot1Id: string, slot2Id: string): string[] => {
  const slot1 = parseSlotId(slot1Id);
  const slot2 = parseSlotId(slot2Id);
  
  if (!slot1 || !slot2) return [];
  
  const alternateDaysFromSlot2 = getAlternateDays(slot2.day);
  const options: string[] = [];
  
  alternateDaysFromSlot2.forEach((day) => {
    // Slot 3 day must also be different from Slot 1 day
    if (day !== slot1.day) {
      ([1, 2, 3] as SlotNumber[]).forEach((slotNum) => {
        options.push(`${day}-${slotNum}`);
      });
    }
  });
  
  return options;
};

/**
 * Get all possible Slot 3 options based only on Slot 1 (for display when Slot 2 not yet selected)
 */
export const getAllPossibleSlot3Options = (slot1Id: string): string[] => {
  const slot1 = parseSlotId(slot1Id);
  if (!slot1) return [];
  
  // Any day that's not the same as Slot 1 and could potentially be alternate from some Slot 2
  const options: string[] = [];
  
  DAYS.forEach((day) => {
    if (day !== slot1.day) {
      ([1, 2, 3] as SlotNumber[]).forEach((slotNum) => {
        options.push(`${day}-${slotNum}`);
      });
    }
  });
  
  return options;
};

/**
 * Check if a day is an alternate day from another
 */
export const isAlternateDay = (day1: Day, day2: Day): boolean => {
  const index1 = DAY_INDEX[day1];
  const index2 = DAY_INDEX[day2];
  const dayDiff = Math.abs(index1 - index2);
  const wrappedDiff = Math.min(dayDiff, DAYS.length - dayDiff);
  return wrappedDiff >= 2;
};

/**
 * Validate a complete slot selection
 */
export const validateSlotSelection = (
  slot1Id: string,
  slot2Id: string,
  slot3Id: string
): { valid: boolean; error?: string } => {
  const slot1 = parseSlotId(slot1Id);
  const slot2 = parseSlotId(slot2Id);
  const slot3 = parseSlotId(slot3Id);
  
  if (!slot1 || !slot2 || !slot3) {
    return { valid: false, error: 'Invalid slot format' };
  }
  
  // Check Slot 2 is alternate from Slot 1
  if (!isAlternateDay(slot1.day, slot2.day)) {
    return { 
      valid: false, 
      error: `Slot 2 (${slot2.day}) must be on an alternate day from Slot 1 (${slot1.day}). Skip at least 1 day.` 
    };
  }
  
  // Check Slot 3 is alternate from Slot 2
  if (!isAlternateDay(slot2.day, slot3.day)) {
    return { 
      valid: false, 
      error: `Slot 3 (${slot3.day}) must be on an alternate day from Slot 2 (${slot2.day}). Skip at least 1 day.` 
    };
  }
  
  // Check Slot 3 is different from Slot 1
  if (slot1.day === slot3.day) {
    return { 
      valid: false, 
      error: `Slot 3 cannot be on the same day as Slot 1 (${slot1.day})` 
    };
  }
  
  return { valid: true };
};

// Legacy compatibility - kept for backward compatibility if needed elsewhere
export interface ConditionalDependencyRule {
  slot1: string;
  slot2Options: string[];
  slot3BySlot2: Record<string, string>;
}

export const getConditionalDependencyRule = (slot1Id: string): ConditionalDependencyRule | undefined => {
  const slot2Options = getAllowedSlot2Options(slot1Id);
  if (slot2Options.length === 0) return undefined;
  
  const slot3BySlot2: Record<string, string> = {};
  slot2Options.forEach((slot2) => {
    const slot3Options = getAllowedSlot3Options(slot1Id, slot2);
    if (slot3Options.length > 0) {
      slot3BySlot2[slot2] = slot3Options[0]; // Default to first option
    }
  });
  
  return {
    slot1: slot1Id,
    slot2Options,
    slot3BySlot2,
  };
};

export const getMandatorySlot3 = (slot1Id: string, slot2Id: string): string | undefined => {
  const options = getAllowedSlot3Options(slot1Id, slot2Id);
  return options.length > 0 ? options[0] : undefined;
};
