// Slot Dependency Rules - Fully Algorithmic System
// No manual rules - Slot 2 and Slot 3 are derived automatically

import { Day, SlotNumber, DAYS } from './slotData';

export interface SlotId {
  day: Day;
  slotNumber: SlotNumber;
}

// Day index for cyclic calculations (0-5)
const DAY_INDEX: Record<Day, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
};

/**
 * Get day from index (cyclic, wraps around)
 */
const getDayFromIndex = (index: number): Day => {
  const normalizedIndex = ((index % 6) + 6) % 6; // Handle negative indices
  return DAYS[normalizedIndex];
};

/**
 * Get slot number from index (cyclic 1→2→3→1)
 */
const getSlotFromIndex = (index: number): SlotNumber => {
  const normalizedIndex = ((index - 1) % 3 + 3) % 3 + 1;
  return normalizedIndex as SlotNumber;
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
 * Format slot ID from day and slot number
 */
export const formatSlotId = (day: Day, slotNumber: SlotNumber): string => {
  return `${day}-${slotNumber}`;
};

/**
 * AUTOMATIC RULE: Get Slot 2 day from Slot 1 day
 * Slot 2 day = Slot 1 day + 2 (cyclic)
 */
export const getSlot2Day = (slot1Day: Day): Day => {
  const slot1Index = DAY_INDEX[slot1Day];
  return getDayFromIndex(slot1Index + 2);
};

/**
 * AUTOMATIC RULE: Get allowed Slot 2 time options based on Slot 1 time
 * Slot 2 can be: (Slot1 + 1) OR (Slot1 + 2) - cyclic
 * Essentially: any slot number that is NOT the same as Slot 1
 */
export const getSlot2TimeOptions = (slot1Number: SlotNumber): SlotNumber[] => {
  const option1 = getSlotFromIndex(slot1Number + 1);
  const option2 = getSlotFromIndex(slot1Number + 2);
  return [option1, option2];
};

/**
 * AUTOMATIC RULE: Get Slot 3 day from Slot 2 day
 * Slot 3 day = Slot 2 day + 2 (cyclic)
 */
export const getSlot3Day = (slot2Day: Day): Day => {
  const slot2Index = DAY_INDEX[slot2Day];
  return getDayFromIndex(slot2Index + 2);
};

/**
 * AUTOMATIC RULE: Get Slot 3 time based on Slot 1 and Slot 2 times
 * Slot 3 = the remaining time slot (not slot1, not slot2)
 */
export const getSlot3Time = (slot1Number: SlotNumber, slot2Number: SlotNumber): SlotNumber => {
  const allSlots: SlotNumber[] = [1, 2, 3];
  const remaining = allSlots.find(s => s !== slot1Number && s !== slot2Number);
  return remaining as SlotNumber;
};

/**
 * Get all allowed Slot 2 options based on Slot 1 selection
 * Returns array of slot IDs (e.g., ["Wednesday-2", "Wednesday-3"])
 */
export const getAllowedSlot2Options = (slot1Id: string): string[] => {
  const slot1 = parseSlotId(slot1Id);
  if (!slot1) return [];
  
  const slot2Day = getSlot2Day(slot1.day);
  const slot2TimeOptions = getSlot2TimeOptions(slot1.slotNumber);
  
  return slot2TimeOptions.map(time => formatSlotId(slot2Day, time));
};

/**
 * Get the mandatory Slot 3 based on Slot 1 and Slot 2 selection
 * Returns single slot ID (e.g., "Friday-3") - Slot 3 is AUTO-ASSIGNED
 */
export const getMandatorySlot3 = (slot1Id: string, slot2Id: string): string | undefined => {
  const slot1 = parseSlotId(slot1Id);
  const slot2 = parseSlotId(slot2Id);
  
  if (!slot1 || !slot2) return undefined;
  
  const slot3Day = getSlot3Day(slot2.day);
  const slot3Time = getSlot3Time(slot1.slotNumber, slot2.slotNumber);
  
  return formatSlotId(slot3Day, slot3Time);
};

/**
 * Get all allowed Slot 3 options (for display purposes)
 * In the algorithmic system, there's only ONE valid Slot 3 per Slot 2 choice
 */
export const getAllowedSlot3Options = (slot1Id: string, slot2Id: string): string[] => {
  const slot3 = getMandatorySlot3(slot1Id, slot2Id);
  return slot3 ? [slot3] : [];
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
  
  // Rule 1: All slots must be on different days
  if (slot1.day === slot2.day || slot2.day === slot3.day || slot1.day === slot3.day) {
    return { valid: false, error: 'All 3 slots must be on different days' };
  }
  
  // Rule 2: All slot times must be different
  if (slot1.slotNumber === slot2.slotNumber || 
      slot2.slotNumber === slot3.slotNumber || 
      slot1.slotNumber === slot3.slotNumber) {
    return { valid: false, error: 'All 3 slots must have different time periods' };
  }
  
  // Rule 3: Slot 2 day must be Slot 1 day + 2
  const expectedSlot2Day = getSlot2Day(slot1.day);
  if (slot2.day !== expectedSlot2Day) {
    return { 
      valid: false, 
      error: `Slot 2 must be on ${expectedSlot2Day} (Slot 1 day + 2)` 
    };
  }
  
  // Rule 4: Slot 2 time must be one of the allowed options
  const allowedSlot2Times = getSlot2TimeOptions(slot1.slotNumber);
  if (!allowedSlot2Times.includes(slot2.slotNumber)) {
    return { 
      valid: false, 
      error: `Slot 2 time must be Slot ${allowedSlot2Times.join(' or Slot ')}` 
    };
  }
  
  // Rule 5: Slot 3 day must be Slot 2 day + 2
  const expectedSlot3Day = getSlot3Day(slot2.day);
  if (slot3.day !== expectedSlot3Day) {
    return { 
      valid: false, 
      error: `Slot 3 must be on ${expectedSlot3Day} (Slot 2 day + 2)` 
    };
  }
  
  // Rule 6: Slot 3 time must be the remaining slot
  const expectedSlot3Time = getSlot3Time(slot1.slotNumber, slot2.slotNumber);
  if (slot3.slotNumber !== expectedSlot3Time) {
    return { 
      valid: false, 
      error: `Slot 3 time must be Slot ${expectedSlot3Time}` 
    };
  }
  
  return { valid: true };
};

/**
 * Get a human-readable description of the rule for a given Slot 1
 */
export const getRuleDescription = (slot1Id: string): string => {
  const slot1 = parseSlotId(slot1Id);
  if (!slot1) return '';
  
  const slot2Day = getSlot2Day(slot1.day);
  const slot2Options = getSlot2TimeOptions(slot1.slotNumber);
  const slot3Day = getSlot3Day(slot2Day);
  
  return `Slot 2 will be on ${slot2Day} (Slot ${slot2Options.join(' or ')}). Slot 3 will be on ${slot3Day}.`;
};

// Legacy compatibility exports
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
    const slot3 = getMandatorySlot3(slot1Id, slot2);
    if (slot3) {
      slot3BySlot2[slot2] = slot3;
    }
  });
  
  return {
    slot1: slot1Id,
    slot2Options,
    slot3BySlot2,
  };
};

// Utility to check if a slot is allowed for Slot 2 position
export const isValidSlot2Choice = (slot1Id: string, candidateSlot2Id: string): boolean => {
  const allowedOptions = getAllowedSlot2Options(slot1Id);
  return allowedOptions.includes(candidateSlot2Id);
};

// Utility to get all possible Slot 3 options when Slot 2 is not yet selected
export const getAllPossibleSlot3Options = (slot1Id: string): string[] => {
  const slot2Options = getAllowedSlot2Options(slot1Id);
  const slot3Set = new Set<string>();
  
  slot2Options.forEach(slot2Id => {
    const slot3 = getMandatorySlot3(slot1Id, slot2Id);
    if (slot3) slot3Set.add(slot3);
  });
  
  return Array.from(slot3Set);
};
