import { randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Random number with exactly `digits` digits (no leading zero). */
export function randomDigits(digits: number): string {
  return String(randomInt(10 ** (digits - 1), 10 ** digits));
}

/**
 * Generates a human-friendly ID (e.g. CL-4821) that is not already used in
 * `table.column`. The previous 3-digit random IDs collided after a few dozen
 * rows; checking first and retrying makes a collision a non-event.
 */
export async function generateUniqueId(
  supabase: SupabaseClient,
  table: string,
  column: string,
  make: () => string,
  attempts = 10,
): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const candidate = make();
    const { count, error } = await supabase
      .from(table)
      .select(column, { count: "exact", head: true })
      .eq(column, candidate);
    if (error) throw error;
    if (!count) return candidate;
  }
  throw new Error(`Could not generate a unique ${column}`);
}
