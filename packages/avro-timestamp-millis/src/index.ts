import { Type, types } from 'avsc';

/**
 * Custom logical type used to encode native Date objects as long.
 */
export class AvroTimestampMillis extends types.LogicalType {
  _fromValue(val: number): Date {
    return new Date(val);
  }

  _toValue(date: Date): number;
  _toValue<T>(date: T): T;
  _toValue(date: unknown): unknown {
    return date instanceof Date ? date.getTime() : date;
  }

  _resolve(type: Type): unknown {
    if (Type.isType(type, 'int', 'string', 'logical:timestamp-millis')) {
      return this._fromValue;
    }
    return undefined;
  }
}
