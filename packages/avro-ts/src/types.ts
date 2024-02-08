import { Document, DocumentContext } from '@ovotech/ts-compose';
import { Schema } from 'avsc';
import * as ts from 'typescript';

export type CustomLogicalType =
  | { module: string; named: string }
  | { module: string; defaultAs: string }
  | { module: string; allAs: string };

export interface Context extends DocumentContext {
  logicalTypes?: { [key: string]: string | CustomLogicalType };
  namespace?: string;
  refs?: { [key: string]: Schema };
  external?: { [file: string]: { [key: string]: Schema } };
  defaultsAsOptional?: boolean;
  withTypescriptEnums?: boolean;
  disableAutoWrapUnions?: boolean;
}

export type Convert<TSchema = Schema, TType = ts.TypeNode> = (
  context: Context,
  type: TSchema,
) => Document<TType, Context>;
