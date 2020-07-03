import { Type, types } from 'avsc';

const millisecondsInADay = 8.64e7;

/**
 * Custom logical type used to encode native Date objects as int.
 */
export class AvroEpochDays extends types.LogicalType {
  public _fromValue(val: number): Date {
    return new Date(val * millisecondsInADay);
  }

  public _fromStringValue(val: string): Date {
    return new Date(val);
  }

  public _toValue(date: Date): number;
  public _toValue<T>(date: T): T;
  public _toValue(value: unknown): unknown {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / millisecondsInADay);
    } else {
      return value;
    }
  }

  public _resolve(type: Type): unknown {
    if (Type.isType(type, 'int', 'logical:date')) {
      return this._fromValue;
    } else if (Type.isType(type, 'string')) {
      return this._fromStringValue;
    }
    return undefined;
  }
}
