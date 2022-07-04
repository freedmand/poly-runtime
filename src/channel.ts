export class Data<Type> {
  public listeners: ((value: Type) => void)[] = [];

  constructor(public _value: Type) {}

  get value(): Type {
    return this._value;
  }

  set value(_value: Type) {
    this._value = _value;
    for (const listener of this.listeners) {
      listener(_value);
    }
  }
}

type Accessor<Type, SubType> = (value: Type) => SubType;

export class DataObject<Type, Index> {
  public listeners: ((value: Type, index: Index) => void)[] = [];

  constructor(public _value: Type) {}

  get value(): Type {
    return this._value;
  }

  get<SubType>(accessor: Accessor<Type, SubType>) {
    return accessor(this._value);
  }

  set value(_value: Type) {
    this._value = _value;
    for (const listener of this.listeners) {
      listener(_value);
    }
  }
}
