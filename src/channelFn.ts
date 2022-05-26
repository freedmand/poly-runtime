/**
 * This file provides a standard library of automatic channel functions to
 * provide common functionality
 */

import { AutomaticChannel, Channel, DataChannel } from "./channel";
import { indices, Key } from "./indexSpecifier";
import { range, recordMap, sum } from "./util";

/**
 * String channel
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
 * Number channel
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

  /**
   * Sums a number list
   */
  static sum(numbers: List<number>) {
    return new AutomaticChannel([numbers], (numbers) => sum(numbers));
  }
}

/**
 * List channel
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
   * Pushes the specified data onto the end of the list
   * @param newData The data to push on the end of the list
   */
  push(newData: T) {
    this._data.push(newData);

    // Notify any downstream channels that are connected
    for (const { channel, connector } of this.connectedChannels) {
      // Mark the channel as dirty
      channel.markDirty(connector(indices([this._data.length - 1])));
    }
  }

  /**
   * Inserts the specified data into the list
   * @param index The index at which to insert the data before (use the list's
   * length to insert at end)
   * @param newData The data to insert into the list
   */
  insert(index: Key, newData: T) {
    this._data.splice(index as number, 0, newData);

    // Notify any downstream channels that are connected
    for (const { channel, connector } of this.connectedChannels) {
      // Mark the channel as dirty
      channel.markDirty(
        connector(indices(range(index as number, this._data.length)))
      );
    }
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

/**
 * Dictionary channel
 */
export class Dictionary<Value> extends DataChannel<Record<Key, Value>> {
  /**
   * Sets the data for the dictionary at the specified index to the specified
   * item. Only the exact index changed is marked dirty, triggering the most
   * minimal possible downstream updates
   * @param index The index of the dictionary to set
   * @param subData The item to set
   */
  setItem(index: Key, subData: Value) {
    // Update the underlying data
    this._data[index] = subData;

    // Notify any downstream channels that are connected
    for (const { channel, connector } of this.connectedChannels) {
      // Mark the channel as dirty
      channel.markDirty(connector(indices([index])));
    }
  }

  /**
   * @returns An automatic channel with the keys of the dictionary
   */
  keys() {
    return new AutomaticChannel(
      [this as Channel<Record<Key, Value>>],
      (dictionary: Record<Key, Value>) => Object.keys(dictionary)
    );
  }

  /**
   * @returns An automatic channel with the values of the dictionary
   */
  values() {
    return new AutomaticChannel(
      [this as Channel<Record<Key, Value>>],
      (dictionary: Record<Key, Value>) => Object.values(dictionary)
    );
  }

  /**
   * @returns An automatic channel with the entries of the dictionary
   */
  entries() {
    return new AutomaticChannel(
      [this as Channel<Record<Key, Value>>],
      (dictionary: Record<Key, Value>) => Object.entries(dictionary)
    );
  }

  /**
   * Applies a map function to the list
   * @param fn A function to apply to every element of the list
   * @returns An automatic list channel that is the result of applying the map
   * function to every element of the list
   */
  map<U>(fn: (value: Value) => U) {
    return new AutomaticChannel(
      // Derived from only this channel
      [this as Channel<Record<Key, Value>>],
      // The mapping function is straightforward
      (dictionary: Record<Key, Value>) =>
        Object.fromEntries(
          Object.entries(dictionary).map<[Key, U]>(([key, item]) => [
            key,
            fn(item),
          ])
        ),
      // The channel connector is a one-to-one mapping
      [(index) => index],
      // The update index function
      (items, data, i) => {
        data[i as string] = fn(items[0][i]);
      }
    );
  }
}

/**
 * The fully unraveled data type for a channel. If the channel's data type
 * includes other channels, these are in turn unraveled recursively.
 */
export type UnravelData<T> = T extends Channel<infer Data>
  ? UnravelData<Data>
  : T extends Array<infer ArrayData>
  ? Array<UnravelData<ArrayData>>
  : T extends Record<Key, infer RecordData>
  ? Record<Key, UnravelData<RecordData>>
  : T;

/**
 * Unravels the data for a specified object. If the object is a channel, return
 * its data type unraveled. If the object is an array or dictionary, unravel
 * each of its values. If the object cannot be unraveled, return the object as
 * is. This method operates recursively to fully extract an object and leave no
 * channel instances behind.
 * @param object An object whose data to unravel
 * @returns The fully and recursively unraveled data
 */
export function unravelData<T>(object: T): UnravelData<T> {
  if (object instanceof Channel) {
    // Unravel the channel
    return object.data;
  }
  if (Array.isArray(object)) {
    // Unravel the array
    return object.map(unravelData) as UnravelData<T>;
  }
  if (object === Object(object)) {
    // Unravel the object
    return recordMap(object as Record<Key, any>, unravelData) as UnravelData<T>;
  }
  // The object cannot be further unraveled; return as is
  return object as UnravelData<T>;
}
