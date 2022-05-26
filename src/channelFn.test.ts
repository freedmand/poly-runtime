import { Dictionary, List, Number, String, unravelData } from "./channelFn";

describe("basic operators", () => {
  test("addition", () => {
    // Simple add: 1 + 1 should equal 2
    expect(Number.add(new Number(1), new Number(1)).data).toEqual(2);
  });

  test("addition with data change", () => {
    const number = new Number(1);
    const numberPlusOne = Number.add(number, new Number(1));
    // 1 + 1 = 2
    expect(numberPlusOne.data).toEqual(2);

    // Set number to 5
    number.data = 5;
    // New numberPlusOne sum should equal six (5 + 1 = 6)
    expect(numberPlusOne.data).toEqual(6);
  });
});

describe("channel", () => {
  test("nested channel data update", () => {
    // Set up basic data
    const times = new Number(1);
    const text = new String("cat");

    // Text times is text repeated times amount ("cat" x 1 = "cat")
    const textTimes = String.repeat(text, times);
    expect(textTimes.data).toEqual("cat");

    // Times twice is times added to itself (times x 2)
    const timesTwice = Number.add(times, times);
    // Text times twice is text times repeated times twice times
    const textTimesTwice = String.repeat(textTimes, timesTwice);
    expect(textTimesTwice.data).toEqual("catcat");

    // Now, when we increase times by one, textTimesTwice should increase
    // by a factor of 4
    times.data = 2;
    // We will set the text to "dog" as well
    text.data = "dog";
    // The text should now repeat "dog" 8 times
    expect(textTimesTwice.data).toEqual("dogdogdogdogdogdogdogdog");
  });

  test("channel update calculated lazily", () => {
    const number1 = new Number(1);
    const number2 = new Number(2);
    // Create a simple sum
    const sum = Number.add(number1, number2);

    // Spy on the sum's update function, and the numbers' data access
    const sumUpdate = jest.spyOn(sum, "updateFunction");
    const number1DataGet = jest.spyOn(number1, "data", "get");
    const number2DataGet = jest.spyOn(number2, "data", "get");

    // When we change the underlying data, the update function is not called...
    number1.data = 2;
    expect(sumUpdate).toHaveBeenCalledTimes(0);
    expect(number1DataGet).toHaveBeenCalledTimes(0);
    expect(number2DataGet).toHaveBeenCalledTimes(0);

    // ... until sum's data is retrieved
    expect(sum.data).toEqual(4);
    expect(sumUpdate).toHaveBeenCalledTimes(1);
    // Number 1 and number 2 both had their data retrieved
    expect(number1DataGet).toHaveBeenCalledTimes(1);
    expect(number2DataGet).toHaveBeenCalledTimes(1);

    // Retrieving the sum data again will not result in additional calls because
    // the data is cached
    expect(sum.data).toEqual(4);
    expect(sumUpdate).toHaveBeenCalledTimes(1);
    expect(number1DataGet).toHaveBeenCalledTimes(1);
    expect(number2DataGet).toHaveBeenCalledTimes(1);
  });
});

describe("list", () => {
  test("map", () => {
    // Double all the elements of a list with a map function
    const list = new List([1, 2, 3]);
    const listDoubled = list.map((x) => x * 2);
    expect(listDoubled.data).toEqual([2, 4, 6]);

    // Set the list to something new
    list.data = [5];
    // The doubled result should now reflect the new data
    expect(listDoubled.data).toEqual([10]);

    // Set the list to empty data
    list.data = [];
    // The doubled result should also be empty
    expect(listDoubled.data).toEqual([]);
  });

  test("fine-grained list updates", () => {
    // Double all the elements of a list with a map function
    const list = new List([1, 2, 3]);
    const listDoubled = list.map((x) => x * 2);
    expect(listDoubled.data).toEqual([2, 4, 6]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(listDoubled, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(listDoubled, "updateIndexFunction");

    // Set the item at index 1 to 10 and the item at index 2 to 20
    list.setItem(1, 10);
    list.setItem(2, 20);

    // Nothing should update at this point
    expect(updateFunction).toHaveBeenCalledTimes(0);
    expect(updateIndexFunction).toHaveBeenCalledTimes(0);

    // Now, retrieve the updated data to call the updaters
    expect(listDoubled.data).toEqual([2, 20, 40]);

    // Only the update index function should be called
    expect(updateFunction).toHaveBeenCalledTimes(0);
    expect(updateIndexFunction).toHaveBeenCalledTimes(2);

    // Retrieving the data again should result in no additional calls
    expect(listDoubled.data).toEqual([2, 20, 40]);
    expect(updateFunction).toHaveBeenCalledTimes(0);
    expect(updateIndexFunction).toHaveBeenCalledTimes(2);
  });

  test("push", () => {
    const list = new List([1, 2, 3]);
    const tenMinusList = list.map((x) => 10 - x);

    expect(tenMinusList.data).toEqual([9, 8, 7]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(tenMinusList, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(tenMinusList, "updateIndexFunction");

    list.push(4);

    expect(tenMinusList.data).toEqual([9, 8, 7, 6]);

    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(1);
  });

  test("insert push", () => {
    const list = new List([1, 2, 3, 4]);
    const tenMinusList = list.map((x) => 10 - x);

    expect(tenMinusList.data).toEqual([9, 8, 7, 6]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(tenMinusList, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(tenMinusList, "updateIndexFunction");

    list.insert(2, 10);

    expect(tenMinusList.data).toEqual([9, 8, 0, 7, 6]);

    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(3);
  });

  test("insert twice (before)", () => {
    const list = new List([1, 2, 3, 4]);
    const tenMinusList = list.map((x) => 10 - x);

    expect(tenMinusList.data).toEqual([9, 8, 7, 6]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(tenMinusList, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(tenMinusList, "updateIndexFunction");

    list.insert(2, 10);
    list.insert(2, 11);

    expect(tenMinusList.data).toEqual([9, 8, -1, 0, 7, 6]);

    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(4);
  });

  test("insert twice (after)", () => {
    const list = new List([1, 2, 3, 4]);
    const tenMinusList = list.map((x) => 10 - x);

    expect(tenMinusList.data).toEqual([9, 8, 7, 6]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(tenMinusList, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(tenMinusList, "updateIndexFunction");

    list.insert(2, 10);
    list.insert(3, 11);

    expect(tenMinusList.data).toEqual([9, 8, 0, -1, 7, 6]);

    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(4);
  });

  test("insert twice (beginning and end)", () => {
    const list = new List([1, 2, 3, 4]);
    const tenMinusList = list.map((x) => 10 - x);

    expect(tenMinusList.data).toEqual([9, 8, 7, 6]);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(tenMinusList, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(tenMinusList, "updateIndexFunction");

    list.insert(0, 10);
    list.insert(5, 11);

    expect(tenMinusList.data).toEqual([0, 9, 8, 7, 6, -1]);

    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(6);
  });

  test("sum", () => {
    const list = new List([1]);
    const sum = Number.sum(list);
    expect(sum.data).toEqual(1);

    // Spy on the overall update function
    const updateFunction = jest.spyOn(sum, "updateFunction");

    list.insert(0, 9);
    list.push(100);
    expect(sum.data).toEqual(110);

    expect(updateFunction).toBeCalledTimes(1);
  });
});

describe("dictionary", () => {
  test("keys", () => {
    // Empty dictionary has no keys
    const dictionary = new Dictionary<number>({});
    const keys = dictionary.keys();
    expect(keys.data).toEqual([]);

    // Add in a single key
    dictionary.setItem("a", 2);
    expect(keys.data).toEqual(["a"]);

    // Add in multiple keys and repeat one of them
    dictionary.setItem("b", 3);
    dictionary.setItem("c", 4);
    dictionary.setItem("a", 5);
    expect(keys.data).toEqual(["a", "b", "c"]);
  });

  test("map", () => {
    const dictionary = new Dictionary<number>({ a: 2, b: 3 });
    const parenthesesDictionary = dictionary.map((x) => `(${x})`);
    expect(parenthesesDictionary.data).toEqual({ a: "(2)", b: "(3)" });

    // Spy on the overall update function
    const updateFunction = jest.spyOn(parenthesesDictionary, "updateFunction");
    // Spy on the index update function
    const updateIndexFunction = jest.spyOn(
      parenthesesDictionary,
      "updateIndexFunction"
    );

    dictionary.setItem("a", 5);
    expect(parenthesesDictionary.data).toEqual({ a: "(5)", b: "(3)" });
    expect(updateFunction).toBeCalledTimes(0);
    expect(updateIndexFunction).toBeCalledTimes(1);
  });
});

describe("complex", () => {
  test("dictionary with list fine-grained", () => {
    // Create two lists
    const list1 = new List([1, 2, 3]);
    const list2 = new List([4, 5, 6]);
    // And enclose them in a dictionary
    const dictionary = new Dictionary({
      a: list1,
      b: list2,
    });
    // Make a derived dictionary with derived lists that are multiplied by 2
    const dictionaryTimes2 = dictionary.map((numbers) =>
      numbers.map((x) => x * 2)
    );

    // Here's what the data should look like now
    expect(unravelData(dictionary.data)).toEqual({
      a: [1, 2, 3],
      b: [4, 5, 6],
    });
    expect(unravelData(dictionaryTimes2.data)).toEqual({
      a: [2, 4, 6],
      b: [8, 10, 12],
    });
    // Extract the multiplied list instances
    const list1Times2 = dictionaryTimes2.data.a;
    const list2Times2 = dictionaryTimes2.data.b;

    // Spy on all the update and update index functions
    const updateDictionaryFunction = jest.spyOn(
      dictionaryTimes2,
      "updateFunction"
    );
    const updateDictionaryIndexFunction = jest.spyOn(
      dictionaryTimes2,
      "updateIndexFunction"
    );
    const updateList1Function = jest.spyOn(list1Times2, "updateFunction");
    const updateList1IndexFunction = jest.spyOn(
      list1Times2,
      "updateIndexFunction"
    );
    const updateList2Function = jest.spyOn(list2Times2, "updateFunction");
    const updateList2IndexFunction = jest.spyOn(
      list2Times2,
      "updateIndexFunction"
    );

    // Make a change to an underlying list
    list1.setItem(2, 9);

    expect(unravelData(dictionary.data)).toEqual({
      a: [1, 2, 9],
      b: [4, 5, 6],
    });
    expect(unravelData(dictionaryTimes2.data)).toEqual({
      a: [2, 4, 18],
      b: [8, 10, 12],
    });

    // Only list 1's index function should be called out of everything
    expect(updateDictionaryFunction).toBeCalledTimes(0);
    expect(updateDictionaryIndexFunction).toBeCalledTimes(0);
    expect(updateList1Function).toBeCalledTimes(0);
    expect(updateList1IndexFunction).toBeCalledTimes(1);
    expect(updateList2Function).toBeCalledTimes(0);
    expect(updateList2IndexFunction).toBeCalledTimes(0);
  });
});
