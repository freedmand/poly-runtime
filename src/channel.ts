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

/**
 * A channel is a generic data structure for storing and flowing data. It is a
 * way to efficiently communicate when data changes and provide ways to respond
 * to data updates.
 */
export abstract class Channel<DataType> {
  /**
   * All the downstream connected channels that respond to updates from this
   * channel.
   */
  public connectedChannels: Channel<any>[] = [];

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
  protected abstract dirty: boolean;

  /**
   * The underlying data stored in the channel.
   */
  abstract get data(): DataType;

  /**
   * Marks the channel as dirty, and triggers changes to all connected channels
   * downstream recursively.
   */
  markDirty() {
    this.dirty = true;
    for (const channel of this.connectedChannels) {
      // Recursively mark all downstream channels as dirty
      channel.markDirty();
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

  protected dirty = false;
  protected cachedData;

  /**
   * Initializes the channel with data
   * @param data The initial data in the channel
   */
  constructor(data: DataType) {
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
    for (const channel of this.connectedChannels) {
      // Mark the channel as dirty
      channel.markDirty();
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
  protected dirty = true;
  protected cachedData: DataType = undefined!;

  /**
   * @param incomingChannels An array of incoming channels
   * @param updateFunction An update function that takes as input data
   *     corresponding to each incoming channel's data and outputs data for
   *     this channel.
   */
  constructor(
    readonly incomingChannels: IncomingChannelType,
    readonly updateFunction: (
      ...incomingData: ChannelListDataType<IncomingChannelType>
    ) => DataType
  ) {
    // Ensure there are incoming channels
    if (incomingChannels.length === 0) {
      throw new NoIncomingChannelsError(
        "Automatic channels must have at least one incoming channel"
      );
    }

    super();

    // Connect the channel to all incoming channels
    for (const incomingChannel of this.incomingChannels) {
      incomingChannel.connectedChannels.push(this);
    }
  }

  /**
   * Calculates the data by reading each incoming channels' data and running
   * the update function. Only channels that are dirty need to be recalculated.
   */
  get data(): DataType {
    if (!this.dirty) {
      // If this does not have to refresh its value, return the cached data
      return this.cachedData;
    }

    // Refresh the value
    const incomingData = this.incomingChannels.map((incomingChannel) => {
      return incomingChannel.data;
    }) as ChannelListDataType<IncomingChannelType>;

    // Run the update function to calculate the new data
    const newData = this.updateFunction(...incomingData);

    // Store the new data in the cache
    this.cachedData = newData;
    // Data is no longer dirty since the cache is current
    this.dirty = false;

    // Return the data
    return this.cachedData;
  }
}
