/**
 * Postgres `time` columns come back from Drizzle as "HH:mm:ss" (or with
 * fractional seconds), but the domain types every hora as "HH:mm" so
 * lexicographic comparisons against form-submitted values stay correct —
 * "09:00" >= "09:00:00" is false as strings even though the times are equal.
 */
export function aHoraDominio(hora: string): string {
  return hora.slice(0, 5);
}
