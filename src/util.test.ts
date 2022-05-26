import { range, recordMap } from "./util";

describe("range", () => {
  test("empty", () => {
    expect(range(0, 0)).toEqual([]);
  });

  test("0 to 9", () => {
    expect(range(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("Just 5", () => {
    expect(range(5, 6)).toEqual([5]);
  });
});

describe("record map", () => {
  test("empty", () => {
    expect(recordMap({}, (x) => `${x}${x}`)).toEqual({});
  });

  test("add 1", () => {
    expect(recordMap({ a: 2, b: 3 }, (x) => x + 1)).toEqual({ a: 3, b: 4 });
  });

  test("to string", () => {
    expect(recordMap({ a: 1 }, (value) => `${value}`)).toEqual({ a: "1" });
  });
});
