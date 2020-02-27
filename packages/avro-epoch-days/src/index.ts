import { Type, types } from 'avsc';

const millisecondsInADay = 8.64e7;

/**
 * Custom logical type used to encode native Date objects as int.
 */
export class AvroEpochDays extends types.LogicalType {
  _fromValue(val: number): Date {
    return new Date(val * millisecondsInADay);
  }

  _fromStringValue(val: string): Date {
    return new Date(val);
  }

  _toValue(date: Date): number;
  _toValue<T>(date: T): T;
  _toValue(value: unknown): unknown {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / millisecondsInADay);
    } else {
      return value;
    }
  }

  _resolve(type: Type): unknown {
    if (Type.isType(type, 'int', 'logical:date')) {
      return this._fromValue;
    } else if (Type.isType(type, 'string')) {
      return this._fromStringValue;
    }
    return undefined;
  }
}
