/**
 * Generates a list of ordered integers
 * @param inclusiveStart The start integer (inclusive)
 * @param exclusiveEnd The end integer (exclusive)
 * @returns An ordered list of integers between the start (inclusive) and end
 * (exclusive)
 */
export function range(inclusiveStart: number, exclusiveEnd: number): number[] {
  const results: number[] = new Array(exclusiveEnd - inclusiveStart);
  for (let i = inclusiveStart; i < exclusiveEnd; i++) {
    results[i - inclusiveStart] = i;
  }
  return results;
}

/**
 * Returns the sum of a numeric list
 * @param numbers The numbers to add together
 * @returns The total of the numbers added together
 */
export function sum(numbers: number[]): number {
  let total = 0;
  for (const number of numbers) {
    total += number;
  }
  return total;
}

/**
 * Maps one record to another record via a map function over the record's values
 * @param record The record whose values to map
 * @param mapFn The function to map the values
 * @returns A new record with the same keys and mapped values
 */
export function recordMap<T, U>(
  record: Record<string | number | symbol, T>,
  mapFn: (item: T) => U
): Record<string | number | symbol, U> {
  return Object.fromEntries(
    Object.entries(record).map<[string | number | Symbol, U]>(
      ([key, value]) => [key, mapFn(value)]
    )
  );
}
