import type { GlossaryEntry } from "./types";

// Mock mode has no fan entries on purpose: the site never invents terms about real people.
// The curated deck (features/tribe/lib/lore.ts) still shows, and the demo form keeps submissions local.
export const glossaryEntries: GlossaryEntry[] = [];
