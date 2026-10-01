/**
 * Generates a human-readable ticket number: TKT-YYYY-NNNNNN
 * Uses the current year and a zero-padded sequence derived from a counter.
 * For production, replace the random fallback with a DB sequence.
 */
export function generateTicketNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `TKT-${year}-${padded}`;
}

export function generateApplicationNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `APP-${year}-${padded}`;
}
