/**
 * Treat the array-shaped public API as a mathematical set while preserving
 * first-seen order for the UI and protocol transcript.
 */
export function uniqueElements(elements: readonly string[]): string[] {
  return [...new Set(elements)];
}
