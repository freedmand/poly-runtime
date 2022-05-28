/**
 * This file provides functionality related to channels
 *
 * Data flows through channels. A channel is a way to communicate when data
 * changes. There are multiple different types of channels:
 *
 * - data channels: a data channel is the simplest kind of channel. It is
 *   connected to underlying data that can be changed
 * - automatic channels: an automatic channel is connected to other channels and
 *   has a value that is dependent on them. For instance, in a data
 *   representation of a person, there might be a data channel for age. There
 *   might be an automatic channel for whether the person is an adult or not
 *   that is connected to the age channel. Automatic channels cannot be changed
 */

import {
  indexAll,
  indexEmpty,
  indexNone,
  IndexSpecifier,
  Key,
  mergeIndexSpecifiers,
} from "./indexSpecifier";

export type Operation = Clear | Splice | Swap | Move;

export interface Clear {
  type: "Clear";
  indices: IndexSpecifier;
}

export interface Splice {
  type: "Splice";
  start: number;
  deleteCount: number;
  insertCount: number;
}

export interface Swap {
  type: "Swap";
  index1: number;
  index2: number;
}

export interface Move {
  type: "Move";
  index: number;
  insert: number;
}

/**
 * A channel connector describes a connection between an incoming channel and an
 * outgoing channel in terms of how indices are connected. The connector is a
 * function that takes the {@link IndexSpecifier} for an incoming channel and
 * returns an {@link IndexSpecifier} describing where those indices affect the
 * outgoing channel.
 */
type ChannelConnector<T> = (
  channelIndex: number,
  operation: Operation
) => [(cachedData: T) => void, IndexSpecifier];

/**
 * A collection of an outgoing channel and its associated
 * {@link ChannelConnector} object
 */
type ChannelWithConnector<T> = {
  channel: Channel<T>;
  connector: ChannelConnector<T>;
};

/**
 * A channel is a generic data structure for storing and flowing data. It is a
 * way to efficiently communicate when data changes and provide ways to respond
 * to data updates.
 */
export abstract class Channel<DataType, OperatorType> {
  /**
   * If set to true, eagerly fetches any data changes instead of waiting lazily
   * to load downstream data updates only when data is requested. This is useful
   * for implementing listeners/watchers that need to reflect changes
   * immediately.
   */
  public eager: boolean = false;

  /**
   * All the downstream connected channels that respond to updates from this
   * channel and their {@link ChannelConnector}s
   */
  public connectedChannels: ChannelWithConnector<any>[] = [];

  /**
   * The last output of data that this channel precalculated. If the data is
   * requested and no changes occurred since the last time the data was
   * calculated, this can be instantly returned.
   */
  protected abstract cachedData: DataType;

  /**
   * Whether the cached data is still current. When a parent channel has an
   * update, this channel will be marked as dirty so the data will rerender.
   */
  protected abstract dirty: IndexSpecifier;

  /**
   * The underlying data stored in the channel.
   */
  abstract get data(): DataType;

  /**
   * Marks the channel as dirty, and triggers changes to all connected channels
   * downstream recursively.
   */
  markDirty(operation: Operation) {
    this.dirty = mergeIndexSpecifiers(this.dirty, indexSpecifier);
    for (let i = 0; i < this.connectedChannels.length; i++) {
      const { channel, connector } = this.connectedChannels[i];
      // Recursively mark all downstream channels as dirty (uses the channel's
      // connector to mark the appropriate indices as dirty)
      const [cachedDataModifier, indices] = connector(i, {
        type: "Dirty",
        indices: indexSpecifier,
      });
      cachedDataModifier(this.cachedData);
      channel.markDirty(indices);
    }

    if (this.eager) {
      // Retrieve the data eagerly if updates or callbacks are necessary
      this.data;
    }
  }
}

/**
 * A utility type to enforce a given type parameter is array-like
 */
type EnforceArray<T> = T extends any[] ? T : never;

/**
 * A utility type to extract the underlying data types from a list of channels
 */
type ChannelListDataType<ChannelsType extends Channel<any>[]> = EnforceArray<{
  [ChannelType in keyof ChannelsType]: ChannelsType[ChannelType] extends Channel<
    infer DataType
  >
    ? DataType
    : never;
}>;

/**
 * A data channel is connected to underlying data that can change.
 */
export class DataChannel<DataType> extends Channel<DataType> {
  /**
   * The underlying data stored
   */
  protected _data: DataType;

  protected dirty: IndexSpecifier = indexNone;
  protected cachedData;

  /**
   * Initializes the channel with data
   * @param data The initial data in the channel
   */
  constructor(data: DataType, public eager = false) {
    super();
    this.cachedData = data;
    this._data = data;
  }

  /**
   * Reads the underlying data
   */
  get data(): DataType {
    return this._data;
  }

  /**
   * Sets new data for the channel
   */
  set data(data: DataType) {
    // Update the underlying data
    this._data = data;

    // Notify any downstream channels that are connected
    for (const { channel, connector } of this.connectedChannels) {
      // Mark the channel as dirty using the connector to mark the appropriate
      // indices as dirty
      channel.markDirty(connector(indexAll));
    }
  }
}

/**
 * An error that is thrown if an automatic channel is created with no inputs
 */
export class NoIncomingChannelsError extends Error {}

/**
 * An automatic channel is connected to one or more parent channels and has
 * calculated data that is dependent on these incoming channels' data. The
 * data is computed only when accessed (that is, lazily).
 */
export class AutomaticChannel<
  DataType,
  IncomingChannelType extends Channel<any>[] | [Channel<any>]
> extends Channel<DataType> {
  protected dirty: IndexSpecifier = indexAll;
  protected cachedData: DataType = undefined!;

  readonly incomingConnectors: ChannelConnector[];

  /**
   * @param incomingChannels An array of incoming channels
   * @param updateFunction An update function that takes as input data
   *     corresponding to each incoming channel's data and outputs data for this
   *     channel.
   * @param connectorMap An optional mapping of {@link ChannelConnector}s to
   * apply for each corresponding incoming channel
   * @param updateIndexFunction An optional function to update just a specified
   * index of data that takes in the incoming data, the current cached data
   * value, and the index to modify. The function does not return anything; it
   * just modifies the cached data in place (it's the caller's responsibility to
   * perform this modification)
   */
  constructor(
    readonly incomingChannels: IncomingChannelType,
    readonly updateFunction: (
      ...incomingData: ChannelListDataType<IncomingChannelType>
    ) => DataType,
    readonly connectorMap: ChannelConnector[] = [],
    readonly updateIndexFunction?: (
      incomingData: ChannelListDataType<IncomingChannelType>,
      cachedData: DataType,
      index: Key
    ) => void,
    public eager = false
  ) {
    // Ensure there are incoming channels
    if (incomingChannels.length === 0) {
      throw new NoIncomingChannelsError(
        "Automatic channels must have at least one incoming channel"
      );
    }

    super();

    // Derive the incoming connectors (if no connectors are provided or there's
    // missing elements, they are subbed in with connectors that always return
    // indexAll)
    this.incomingConnectors = incomingChannels.map((_, i) =>
      i >= connectorMap.length ? () => indexAll : connectorMap[i]
    );

    // Connect the channel to all incoming channels
    for (let i = 0; i < this.incomingChannels.length; i++) {
      // Grab the corresponding incoming channel and connector
      const incomingChannel = this.incomingChannels[i];
      const connector = this.incomingConnectors[i];

      // Hook the ChannelWithConnector into each incoming channel
      incomingChannel.connectedChannels.push({
        channel: this,
        connector,
      });
    }
  }

  /**
   * Calculates the data by reading each incoming channels' data and running
   * the update function. Only channels that are dirty need to be recalculated.
   */
  get data(): DataType {
    // Dirty is empty when there is no new data to calculate
    if (indexEmpty(this.dirty)) {
      // Simply return the previously cached data
      return this.cachedData;
    }

    // Grab all the incoming data
    const incomingData = this.incomingChannels.map((incomingChannel) => {
      return incomingChannel.data;
    }) as ChannelListDataType<IncomingChannelType>;

    // Run the update function to calculate the new data
    if (
      this.dirty.indexType === "Indices" &&
      this.updateIndexFunction != null
    ) {
      // If only specified indices are dirty, update each index that needs to be
      // recalculated individually (the cache is updated in-place by the update
      // index function)
      for (const index of this.dirty.indices) {
        this.updateIndexFunction(incomingData, this.cachedData, index);
      }
    } else {
      // Otherwise, calculate all the new data
      const newData = this.updateFunction(...incomingData);
      // Store the new data in the cache
      this.cachedData = newData;
    }

    // Data is no longer dirty since the cache is current
    this.dirty = indexNone;

    // Return the now-cached data
    return this.cachedData;
  }
}
