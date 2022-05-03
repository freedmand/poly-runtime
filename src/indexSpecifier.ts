/**
 * Index specifier provides a fine-grained way to specify a collection of
 * {@link Key}s, where keys are anything that can be used to index JavaScript
 * objects (numbers, strings, and symbols).
 *
 * There are three types of specifiers:
 *
 *  - All: a full collection
 *  - None: an empty collection
 *  - Indices: A collection of specified keys
 */
export type IndexSpecifier = All | None | Indices;

/**
 * A key that can be used to index a JavaScript object
 */
export type Key = string | symbol | number;

/**
 * A full {@link IndexSpecifier} collection
 */
export interface All {
  indexType: "All";
}

/**
 * An empty {@link IndexSpecifier} collection
 */
export interface None {
  indexType: "None";
}

/**
 * An {@link IndexSpecifier} collection of specified keys
 */
export interface Indices {
  indexType: "Indices";
  indices: Key[];
}

/**
 * A constant of an {@link All} index specifier
 */
export const indexAll: All = { indexType: "All" };

/**
 * A constant of a {@link None} index specifier
 */
export const indexNone: None = { indexType: "None" };

/**
 * A quick utility method to get an {@link Indices} index specifier with the
 * specified keys
 * @param indices The specified keys
 * @returns The {@link Indices} index specifier
 */
export function indices(indices: Key[]): Indices {
  return {
    indexType: "Indices",
    indices,
  };
}

/**
 * Returns whether the specified index specifier is empty; that is, nothing is
 * specified.
 * @param indexSpecifier The index specifier
 * @returns Whether the index specifier is empty
 */
export function indexEmpty(indexSpecifier: IndexSpecifier): boolean {
  // None is by default empty
  if (indexSpecifier.indexType === "None") return true;
  // Indices is only empty if no indices are set
  if (indexSpecifier.indexType === "Indices") {
    return indexSpecifier.indices.length === 0;
  }
  // Everything else is not empty
  return false;
}

/**
 * Returns whether an {@link IndexSpecifier} has the specified index
 * @param indexSpecifier The index specifier
 * @param index A key
 * @returns Whether the index specifier has the specified index in it or not
 */
export function indexHas(indexSpecifier: IndexSpecifier, index: Key): boolean {
  // All has everything in it
  if (indexSpecifier.indexType === "All") return true;
  // None has nothing in it
  if (indexSpecifier.indexType === "None") return false;
  // See if the index is explicitly defined in the indices
  return indexSpecifier.indices.includes(index);
}

/**
 * Normalizes a given index specifier
 * @param indexSpecifier An index specifier to normalize
 * @returns A normalized index specifier. If the index specifier is empty,
 * returns {@link indexNone} (even if it is an {@link Indices} collection with
 * an empty list of keys)
 */
export function normalizeIndexSpecifier(indexSpecifier: IndexSpecifier) {
  if (indexEmpty(indexSpecifier)) return indexNone;
  return indexSpecifier;
}

/**
 * Merges two provided {@link IndexSpecifier}s and returns the merged index
 * specifier.
 *
 * If any specifier is {@link indexAll}, that is returned. If both specifiers
 * are empty, {@link indexNone} is returned. If only one of the specifiers is
 * empty, the non-empty one is returned. If both specifiers are a list of
 * indices, the indices list is merged together as a non-duplicated list.
 * @param baseSpecifier The base index specifier
 * @param newSpecifier A new index specifier to merge in
 * @returns A merged index specifier
 */
export function mergeIndexSpecifiers(
  baseSpecifier: IndexSpecifier,
  newSpecifier: IndexSpecifier
): IndexSpecifier {
  // If any specifier is indexAll, return indexAll
  if (baseSpecifier.indexType === "All" || newSpecifier.indexType === "All") {
    return indexAll;
  }

  // If one specifier is indexNone, return the other one
  if (baseSpecifier.indexType === "None") {
    return normalizeIndexSpecifier(newSpecifier);
  }
  if (newSpecifier.indexType === "None") {
    return normalizeIndexSpecifier(baseSpecifier);
  }

  // Both specifiers are a list of indices; merge the indices
  let merged: { [key: Key]: boolean } = {};
  const newIndices: Key[] = [];

  for (const indices of [baseSpecifier.indices, newSpecifier.indices]) {
    // Iterate through every key
    for (const index of indices) {
      if (!merged[index]) {
        // Only add the key in if it hasn't been added in yet
        newIndices.push(index);
        // Keep track that the key has been added in
        merged[index] = true;
      }
    }
  }

  // Return the merged results
  return normalizeIndexSpecifier(indices(newIndices));
}
