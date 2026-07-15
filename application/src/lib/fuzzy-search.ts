/**
 * Simple fuzzy search: checks if all characters of `query` appear in `target`
 * in order (case-insensitive). Returns true for empty query.
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/**
 * Fuzzy-search an array of records against a query string.
 * `fields` is an array of string values extracted from each record.
 * Returns the indices of matching records.
 */
export function fuzzyFilterIndices<T>(
  records: T[],
  query: string,
  getFields: (record: T) => string[],
): number[] {
  if (!query.trim()) return records.map((_, i) => i);
  return records.reduce<number[]>((indices, record, i) => {
    const fields = getFields(record);
    if (fields.some((field) => fuzzyMatch(query, field))) {
      indices.push(i);
    }
    return indices;
  }, []);
}
