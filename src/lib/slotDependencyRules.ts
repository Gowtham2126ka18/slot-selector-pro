// Enhanced Slot Dependency Rules
// Based on the conditional mapping requirements

import { Day, SlotNumber } from './slotData';

export interface SlotId {
  day: Day;
  slotNumber: SlotNumber;
}

export interface ConditionalDependencyRule {
  slot1: string;
  slot2Options: string[];
  // Slot 3 depends on which Slot 2 was chosen
  slot3BySlot2: Record<string, string>;
}

// NEW RULE: Monday Slot 1 → Wednesday Slot 2/3 → Friday (dependent on Slot 2)
// If Slot1 = Monday-1:
//   Slot2 ∈ {Wednesday-2, Wednesday-3}
//   If Slot2 = Wednesday-2 → Slot3 = Friday-3
//   If Slot2 = Wednesday-3 → Slot3 = Friday-2
export const CONDITIONAL_DEPENDENCY_RULES: ConditionalDependencyRule[] = [
  {
    slot1: 'Monday-1',
    slot2Options: ['Wednesday-2', 'Wednesday-3'],
    slot3BySlot2: {
      'Wednesday-2': 'Friday-3',
      'Wednesday-3': 'Friday-2',
    },
  },
  // Other slot1 selections can have their own rules
  {
    slot1: 'Monday-2',
    slot2Options: ['Wednesday-1', 'Thursday-2'],
    slot3BySlot2: {
      'Wednesday-1': 'Saturday-1',
      'Thursday-2': 'Saturday-2',
    },
  },
  {
    slot1: 'Monday-3',
    slot2Options: ['Tuesday-2', 'Thursday-1'],
    slot3BySlot2: {
      'Tuesday-2': 'Friday-1',
      'Thursday-1': 'Friday-2',
    },
  },
  {
    slot1: 'Tuesday-1',
    slot2Options: ['Thursday-2', 'Thursday-3'],
    slot3BySlot2: {
      'Thursday-2': 'Saturday-2',
      'Thursday-3': 'Saturday-3',
    },
  },
  {
    slot1: 'Tuesday-2',
    slot2Options: ['Wednesday-1', 'Friday-2'],
    slot3BySlot2: {
      'Wednesday-1': 'Saturday-1',
      'Friday-2': 'Saturday-1',
    },
  },
  {
    slot1: 'Tuesday-3',
    slot2Options: ['Thursday-1', 'Friday-1'],
    slot3BySlot2: {
      'Thursday-1': 'Saturday-2',
      'Friday-1': 'Saturday-3',
    },
  },
  {
    slot1: 'Wednesday-1',
    slot2Options: ['Friday-2', 'Friday-3'],
    slot3BySlot2: {
      'Friday-2': 'Saturday-1',
      'Friday-3': 'Saturday-2',
    },
  },
  {
    slot1: 'Wednesday-2',
    slot2Options: ['Thursday-1', 'Thursday-3'],
    slot3BySlot2: {
      'Thursday-1': 'Saturday-3',
      'Thursday-3': 'Saturday-3',
    },
  },
  {
    slot1: 'Wednesday-3',
    slot2Options: ['Friday-1', 'Friday-2'],
    slot3BySlot2: {
      'Friday-1': 'Saturday-1',
      'Friday-2': 'Saturday-1',
    },
  },
  {
    slot1: 'Thursday-1',
    slot2Options: ['Friday-2', 'Saturday-1'],
    slot3BySlot2: {
      'Friday-2': 'Saturday-3',
      'Saturday-1': 'Saturday-3',
    },
  },
  {
    slot1: 'Thursday-2',
    slot2Options: ['Friday-1', 'Friday-3'],
    slot3BySlot2: {
      'Friday-1': 'Saturday-2',
      'Friday-3': 'Saturday-2',
    },
  },
  {
    slot1: 'Thursday-3',
    slot2Options: ['Friday-1', 'Saturday-2'],
    slot3BySlot2: {
      'Friday-1': 'Saturday-3',
      'Saturday-2': 'Saturday-3',
    },
  },
  {
    slot1: 'Friday-1',
    slot2Options: ['Saturday-2', 'Saturday-3'],
    slot3BySlot2: {
      'Saturday-2': 'Monday-2',
      'Saturday-3': 'Monday-3',
    },
  },
  {
    slot1: 'Friday-2',
    slot2Options: ['Saturday-1', 'Saturday-3'],
    slot3BySlot2: {
      'Saturday-1': 'Monday-1',
      'Saturday-3': 'Tuesday-1',
    },
  },
  {
    slot1: 'Friday-3',
    slot2Options: ['Saturday-1', 'Saturday-2'],
    slot3BySlot2: {
      'Saturday-1': 'Monday-2',
      'Saturday-2': 'Tuesday-2',
    },
  },
  {
    slot1: 'Saturday-1',
    slot2Options: ['Monday-2', 'Monday-3'],
    slot3BySlot2: {
      'Monday-2': 'Wednesday-1',
      'Monday-3': 'Wednesday-2',
    },
  },
  {
    slot1: 'Saturday-2',
    slot2Options: ['Monday-1', 'Tuesday-2'],
    slot3BySlot2: {
      'Monday-1': 'Thursday-1',
      'Tuesday-2': 'Thursday-2',
    },
  },
  {
    slot1: 'Saturday-3',
    slot2Options: ['Monday-1', 'Tuesday-1'],
    slot3BySlot2: {
      'Monday-1': 'Wednesday-3',
      'Tuesday-1': 'Thursday-3',
    },
  },
];

/**
 * Get the dependency rule for a given Slot 1 selection
 */
export const getConditionalDependencyRule = (slot1Id: string): ConditionalDependencyRule | undefined => {
  return CONDITIONAL_DEPENDENCY_RULES.find((rule) => rule.slot1 === slot1Id);
};

/**
 * Get allowed Slot 2 options based on Slot 1 selection
 */
export const getAllowedSlot2Options = (slot1Id: string): string[] => {
  const rule = getConditionalDependencyRule(slot1Id);
  return rule ? rule.slot2Options : [];
};

/**
 * Get the mandatory Slot 3 based on Slot 1 and Slot 2 selections
 * Returns undefined if no rule exists or Slot 2 is not valid
 */
export const getMandatorySlot3 = (slot1Id: string, slot2Id: string): string | undefined => {
  const rule = getConditionalDependencyRule(slot1Id);
  if (!rule) return undefined;
  return rule.slot3BySlot2[slot2Id];
};

/**
 * Get all allowed Slot 3 options based on Slot 1 (for display purposes when Slot 2 not yet selected)
 */
export const getAllPossibleSlot3Options = (slot1Id: string): string[] => {
  const rule = getConditionalDependencyRule(slot1Id);
  if (!rule) return [];
  return Object.values(rule.slot3BySlot2);
};

/**
 * Validate a complete slot selection
 */
export const validateSlotSelection = (
  slot1Id: string,
  slot2Id: string,
  slot3Id: string
): { valid: boolean; error?: string } => {
  const rule = getConditionalDependencyRule(slot1Id);
  
  if (!rule) {
    return { valid: false, error: `No dependency rule found for Slot 1: ${slot1Id}` };
  }
  
  if (!rule.slot2Options.includes(slot2Id)) {
    return { 
      valid: false, 
      error: `Invalid Slot 2 selection. For ${slot1Id}, Slot 2 must be one of: ${rule.slot2Options.join(', ')}` 
    };
  }
  
  const mandatorySlot3 = rule.slot3BySlot2[slot2Id];
  if (slot3Id !== mandatorySlot3) {
    return { 
      valid: false, 
      error: `Invalid Slot 3 selection. For ${slot1Id} → ${slot2Id}, Slot 3 must be: ${mandatorySlot3}` 
    };
  }
  
  return { valid: true };
};
