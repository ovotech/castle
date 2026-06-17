import * as ts from 'typescript';
import { Document, DocumentContext } from '@ovotech/ts-compose';
import { Schema } from 'avsc';

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
  /**
   * Emit type-only namespaces, moving runtime consts into a sibling object literal so the output is
   * compatible with TypeScript type stripping. Cannot be combined with `withTypescriptEnums`.
   */
  experimentalTypeOnlyNamespaces?: boolean;
}

export type Convert<TSchema = Schema, TType = ts.TypeNode> = (
  context: Context,
  type: TSchema,
) => Document<TType, Context>;
