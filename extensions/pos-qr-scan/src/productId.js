/**
 * @param {unknown} id
 * @returns {string | null}
 */
export function normalizeProductId(id) {
  if (id == null || id === "") {
    return null;
  }

  const str = String(id);
  const gidMatch = str.match(/Product\/(\d+)$/);

  if (gidMatch) {
    return gidMatch[1];
  }

  if (/^\d+$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * @param {unknown} stored
 * @param {unknown} requested
 */
export function productIdsMatch(stored, requested) {
  const storedId = normalizeProductId(stored);
  const requestedId = normalizeProductId(requested);

  return Boolean(storedId && requestedId && storedId === requestedId);
}
