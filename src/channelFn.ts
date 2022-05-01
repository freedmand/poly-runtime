/**
 * This file provides a standard library of automatic channel functions to
 * provide common functionality
 */

import { AutomaticChannel, Channel, DataChannel } from "./channel";

/**
 * String channel functions
 */
export class String extends DataChannel<string> {
  /**
   * Repeats a given piece of text a number of times
   * @param text The text to repeat
   * @param times The number of times to repeat the text
   * @returns The string repeated the specified number of times
   */
  static repeat(text: Channel<string>, times: Channel<number>) {
    return new AutomaticChannel([text, times], (text, times) => {
      let result = "";
      for (let i = 0; i < times; i++) {
        result += text;
      }
      return result;
    });
  }
}

/**
 * Number channel functions
 */
export class Number extends DataChannel<number> {
  /**
   * Adds two numbers
   * @param number1
   * @param number2
   * @returns The sum of the two numbers
   */
  static add(number1: Channel<number>, number2: Channel<number>) {
    return new AutomaticChannel([number1, number2], (n1, n2) => n1 + n2);
  }
}
