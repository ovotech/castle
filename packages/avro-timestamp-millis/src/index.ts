import { Type, types } from 'avsc';

/**
 * Custom logical type used to encode native Date objects as long.
 */
export class AvroTimestampMillis extends types.LogicalType {
  public _fromValue(val: number): Date {
    return new Date(val);
  }

  public _toValue(date: Date): number;
  public _toValue<T>(date: T): T;
  public _toValue(date: unknown): unknown {
    return date instanceof Date ? date.getTime() : date;
  }

  public _resolve(type: Type): unknown {
    if (Type.isType(type, 'int', 'string', 'logical:timestamp-millis')) {
      return this._fromValue;
    }
    return undefined;
  }
}
