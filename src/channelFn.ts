/**
 * This file provides a standard library of automatic channel functions to
 * provide common functionality
 */

import { AutomaticChannel, Channel, DataChannel } from "./channel";
import { indexEmpty, indices, Key } from "./indexSpecifier";

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

/**
 * List channel functions
 */
export class List<T> extends DataChannel<T[]> {
  /**
   * Applies a map function to the list
   * @param fn A function to apply to every element of the list
   * @returns An automatic list channel that is the result of applying the map
   * function to every element of the list
   */
  map<U>(fn: (item: T) => U) {
    return new AutomaticChannel(
      // Derived from only this channel
      [this as Channel<T[]>],
      // The mapping function is straightforward
      (list: T[]) => list.map((item) => fn(item)),
      // The channel connector is a one-to-one mapping
      [(index) => index],
      // The update index function
      (items, data, i) => {
        data[i as number] = fn(items[0][i as number]);
      }
    );
  }

  /**
   * Sets the data for the list at the specified index to the specified item.
   * Only the exact index changed is marked dirty, triggering the most minimal
   * possible downstream updates
   * @param index The index of the list to set
   * @param subData The item to set
   */
  setItem(index: Key, subData: T) {
    // Update the underlying data
    this._data[index as number] = subData;

    // Notify any downstream channels that are connected
    for (const { channel, connector } of this.connectedChannels) {
      // Mark the channel as dirty
      channel.markDirty(connector(indices([index])));
    }
  }
}
