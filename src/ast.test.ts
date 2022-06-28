import { add, list, Number } from "./ast";

test("adding", () => {
  const a = new Number(2);
  const b = new Number(4);
  const sum = add(a, b);

  expect(sum.value).toEqual(6);

  b.value = 5;
  expect(sum.value).toEqual(7);
});

test("listing", () => {
  const a = new Number(2);
  const b = new Number(4);

  const l = list([a, b]);
  expect(l.value).toEqual([2, 4]);

  a.value = 3;
  expect(l.value).toEqual([3, 4]);
});
