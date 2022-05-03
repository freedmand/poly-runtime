import {
  indexAll,
  indexHas,
  indexNone,
  indices,
  mergeIndexSpecifiers,
} from "./indexSpecifier";

test("index has", () => {
  // indexNone has nothing
  expect(indexHas(indexNone, 2)).toBeFalsy();
  // indexAll has everything
  expect(indexHas(indexAll, 2)).toBeTruthy();
  // See if explicit indices includes 2
  expect(indexHas(indices([]), 2)).toBeFalsy();
  expect(indexHas(indices([1]), 2)).toBeFalsy();
  expect(indexHas(indices([1, 3]), 2)).toBeFalsy();
  expect(indexHas(indices([2]), 2)).toBeTruthy();
  expect(indexHas(indices([1, 2, 3]), 2)).toBeTruthy();
});

test("merge index specifiers", () => {
  // If any specifier is indexAll, indexAll should be returned
  expect(mergeIndexSpecifiers(indexNone, indexAll)).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indexAll, indexNone)).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indexAll, indexAll)).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indices([1, 2, 3]), indexAll)).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indexAll, indices([1, 2, 3]))).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indices([]), indexAll)).toEqual(indexAll);
  expect(mergeIndexSpecifiers(indexAll, indices([]))).toEqual(indexAll);

  // If both specifiers are empty, indexNone should be returned
  expect(mergeIndexSpecifiers(indexNone, indexNone)).toEqual(indexNone);
  expect(mergeIndexSpecifiers(indices([]), indexNone)).toEqual(indexNone);
  expect(mergeIndexSpecifiers(indexNone, indices([]))).toEqual(indexNone);
  expect(mergeIndexSpecifiers(indices([]), indices([]))).toEqual(indexNone);

  // If one of the specifiers is empty, return the non-empty one
  expect(mergeIndexSpecifiers(indices([1, 2, 3]), indexNone)).toEqual(
    indices([1, 2, 3])
  );
  expect(mergeIndexSpecifiers(indexNone, indices([1, 2, 3]))).toEqual(
    indices([1, 2, 3])
  );
  expect(mergeIndexSpecifiers(indices([]), indices([1, 2, 3]))).toEqual(
    indices([1, 2, 3])
  );
  expect(mergeIndexSpecifiers(indices([1, 2, 3]), indices([]))).toEqual(
    indices([1, 2, 3])
  );

  // If both indices are specified, merge the two lists
  expect(mergeIndexSpecifiers(indices([1, 2, 3]), indices([1, 2, 3]))).toEqual(
    indices([1, 2, 3])
  );
  expect(mergeIndexSpecifiers(indices([1, 2, 3]), indices([2, 3, 4]))).toEqual(
    indices([1, 2, 3, 4])
  );
  expect(mergeIndexSpecifiers(indices([1]), indices([2, 3]))).toEqual(
    indices([1, 2, 3])
  );
  expect(mergeIndexSpecifiers(indices(["a"]), indices([2, 3]))).toEqual(
    indices(["a", 2, 3])
  );
});
