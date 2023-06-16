import type MagicString from "magic-string";
import type { SourceMap, SourceMapOptions } from "magic-string";
import type { Node } from "acorn";
import type { Visitor } from "estraverse";

export type UnassertAstOptions = Partial<{
  modules: string[];
  variables: string[];
}>;

export type UnassertCodeOptions = UnassertAstOptions &
  Partial<{
    sourceMap: boolean | SourceMapOptions;
  }>;

export type CreateVisitorOptions = UnassertAstOptions &
  Partial<{
    code: MagicString;
  }>;

export type UnassertCodeResult = {
  code: string;
  map: SourceMap | null;
};

export function unassertAst(ast: Node, options?: UnassertAstOptions): Node;

export function unassertCode(
  code: string,
  ast: Node,
  options?: UnassertCodeOptions
): UnassertCodeResult;
export function unassertCode(
  code: MagicString,
  ast: Node,
  options?: UnassertCodeOptions
): MagicString;
export function unassertCode(
  code: string | MagicString,
  ast: Node,
  options?: UnassertCodeOptions
): UnassertCodeResult | MagicString;

export function defaultOptions(): UnassertAstOptions;

export function createVisitor(options?: CreateVisitorOptions): Visitor;
