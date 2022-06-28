/**
 * A listener is an object that subscribes to an incoming channel and invokes a
 * callback on changes
 */
export class Listener<T> {
  /**
   * @param incomingConnection The incoming connection to which the listener
   * subscribes
   * @param callback The callback to invoke any time the underlying value
   * changes, which receives the new value, the cached values for the channel,
   * and the index that has been updated
   * @param unsubscriptionFn A function to unsubscribe the listener, provided by
   * the listener creator
   */
  constructor(
    readonly incomingConnection: Value<T>,
    readonly callback: (
      newValue: T,
      cachedValues: any[],
      cachedIndex: number
    ) => void,
    readonly unsubscriptionFn: (listener: Listener<T>) => void
  ) {}

  /**
   * Unsubscribes the listener
   */
  unsubscribe() {
    return this.unsubscriptionFn(this);
  }
}

export abstract class Value<T> {
  public abstract value: T;
  public listeners: Listener<T>[] = [];

  subscribe(callback: (value: T) => void): Listener<T> {
    const listener = new Listener(this, callback, (listener) =>
      this.unsubscribe(listener)
    );
    this.listeners.push(listener);
    return listener;
  }

  unsubscribe(listener: Listener<T>) {
    const listenerIndex = this.listeners.indexOf(listener);
    if (listenerIndex !== -1) {
      this.listeners.splice(listenerIndex, 1);
    }
  }
}

export class Number extends Value<number> {
  constructor(public value: number) {
    super();
  }
}

/**
 * A utility type to enforce a given type parameter is array-like
 */
type EnforceArray<T> = T extends any[] ? T : never;

/**
 * A utility type to extract the underlying data types from a list of channels
 */
type GetDataType<DataTypes extends Value<any>[]> = EnforceArray<{
  [DataType in keyof DataTypes]: DataTypes[DataType] extends Value<
    infer DataType
  >
    ? DataType
    : never;
}>;

type Cacheable<T> = Uncached | Cached<T>;

export type Uncached = null;
export type Cached<T> = {
  type: "cached";
  value: T;
};

type GetCacheable<T extends any[]> = EnforceArray<{
  [K in keyof T]: Cacheable<T[K]>;
}>;

export class Channel<
  IncomingConnectionsType extends Value<any>[] | [Value<any>],
  DataType
> extends Value<DataType> {
  public cachedValues: GetCacheable<GetDataType<IncomingConnectionsType>>;
  public subscriptions: Listener<any>[] = [];

  // Incoming connections.
  // Outgoing value.
  // Listen for changes on incoming channels,
  // recompute only what's needed on outgoing value.
  constructor(
    readonly incomingConnections: IncomingConnectionsType,
    readonly outgoingValue: (
      params: GetDataType<IncomingConnectionsType>
    ) => DataType
  ) {
    super();

    this.cachedValues = this.incomingConnections.map(
      (x) => null
    ) as GetCacheable<GetDataType<IncomingConnectionsType>>;

    // Subscribe
    for (let i = 0; i < this.incomingConnections.length; i++) {
      const incomingConnection = this.incomingConnections[i];
      this.subscriptions.push(
        incomingConnection.subscribe((_) => (this.cachedValues[i] = null))
      );
    }
  }

  public get value(): DataType {
    return this.outgoingValue(
      this.incomingConnections.map(
        (connection) => connection.value
      ) as GetDataType<IncomingConnectionsType>
    );
  }
}

export function add(
  value1: Value<number>,
  value2: Value<number>
): Value<number> {
  return new Channel([value1, value2], ([value1, value2]) => value1 + value2);

  // const newValue = value1.value + value2.value;
  // return new Number(newValue);
}

export function list<DataType>(values: Value<DataType>[]): Value<DataType[]> {
  return new Channel(values, (values) => values);
}
