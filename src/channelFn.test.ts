import { Number, String } from "./channelFn";

test("basic addition", () => {
  // Simple add: 1 + 1 should equal 2
  expect(Number.add(new Number(1), new Number(1)).data).toEqual(2);
});

test("basic addition with data change", () => {
  const number = new Number(1);
  const numberPlusOne = Number.add(number, new Number(1));
  // 1 + 1 = 2
  expect(numberPlusOne.data).toEqual(2);

  // Set number to 5
  number.data = 5;
  // New numberPlusOne sum should equal six (5 + 1 = 6)
  expect(numberPlusOne.data).toEqual(6);
});

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
