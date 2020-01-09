/**
 * Merges into destination the properties of source
 * - where destination[key] is undefinde, skip
 * - source primitives, arrays and null are assigned to destination props
 * - other objects are recursively merged
 */
export function merge(source, destination) {
  const result = { ...destination };

  for (const key in source) {
    if (destination[key] !== undefined) {
      if (source[key] === null || typeof source[key] !== 'object' || Array.isArray(source[key])) {
        result[key] = source[key];
      } else {
        result[key] = merge(source[key], destination[key]);
      }
    }
  }

  return result;
}
