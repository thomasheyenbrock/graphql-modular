import {
  ArgumentConstNode,
  ArgumentNode,
  DirectiveConstNode,
  DirectiveLocationNode,
  DirectiveNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  EnumValueDefinitionNode,
  EnumValueNode,
  EXECUTABLE_DIRECTIVE_LOCATION,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  ListTypeNode,
  NamedTypeNode,
  NameNode,
  ObjectFieldConstNode,
  ObjectFieldNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  OperationType,
  OperationTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  ScalarTypeExtensionNode,
  SchemaDefinitionNode,
  SchemaExtensionNode,
  SelectionNode,
  TypeNode,
  TypeSystemExtensionNode,
  TYPE_SYSTEM_DIRECTIVE_LOCATION,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
  ValueConstNode,
  ValueNode,
  VariableDefinitionNode,
  VariableNode,
} from "@graphql-modular/language";
import { Token, tokenize } from "./tokenize";

import type {
  DefinitionNode,
  DocumentNode,
  StringValueNode,
} from "@graphql-modular/language";

export function parse(source: string): DocumentNode {
  const tokens = new TokenStream(source);

  function assertToken(expected: Token["type"], expectedValue?: string) {
    const { token, comments } = tokens.peek();
    if (
      !token ||
      token.type !== expected ||
      (typeof expectedValue === "string" && token.value !== expectedValue)
    )
      throw new Error(
        `Unexpected ${token ? `token: ${token.value}` : "EOF"}${
          expectedValue ? ` (expected ${expectedValue})` : ""
        }`
      );
    return { token, comments };
  }

  function isNext(type: Token["type"], value?: string) {
    try {
      assertToken(type, value);
      return true;
    } catch {
      return false;
    }
  }

  function assertCombinedListLength(
    lists: unknown[][],
    expectedPunctuator: string
  ) {
    if (lists.every((list) => list.length === 0))
      assertToken("PUNCTUATOR", expectedPunctuator);
  }

  function takeToken(expected: Token["type"], expectedValue?: string) {
    const next = assertToken(expected, expectedValue);
    tokens.take();
    return next;
  }

  function takePunctuator(punctuator: string) {
    return takeToken("PUNCTUATOR", punctuator);
  }

  function isNextPunctuator(punctuator: string) {
    const { token } = tokens.peek();
    return (
      (token &&
        token.type === "PUNCTUATOR" &&
        (punctuator === undefined || token.value === punctuator)) ||
      false
    );
  }

  function takeIfNextPunctuator(punctuator: string) {
    return isNextPunctuator(punctuator)
      ? tokens.take()
      : { token: undefined, comments: [] };
  }

  function takeList<T>(haultCondition: () => boolean, callback: () => T) {
    const items: T[] = [];

    while (haultCondition()) {
      items.push(callback());
    }

    return items;
  }

  function takeWrappedList<T>(
    isOptional: boolean,
    startPunctuator: string,
    endPunctuator: string,
    callback: () => T
  ) {
    try {
      takePunctuator(startPunctuator);
    } catch (err) {
      if (isOptional) return [];
      throw err;
    }
    const items = takeList(
      () => !takeIfNextPunctuator(endPunctuator).token,
      callback
    );
    return items;
  }

  function takeDelimitedList<T>(
    delimiter: string,
    initializer: Token,
    callback: () => T
  ) {
    const types: T[] = [];

    try {
      takeToken(initializer.type, initializer.value);
    } catch {
      return types;
    }

    try {
      takePunctuator(delimiter);
    } catch {}

    types.push(callback());

    while (takeIfNextPunctuator(delimiter).token) {
      types.push(callback());
    }

    return types;
  }

  function parseDescription(): StringValueNode | null {
    const { token } = tokens.peek();
    if (
      token &&
      (token.type === "STRING_VALUE" || token.type === "BLOCK_STRING_VALUE")
    ) {
      tokens.take();
      return {
        kind: "StringValue",
        value: token.value,
        block: token.type === "BLOCK_STRING_VALUE",
      };
    }
    return null;
  }

  function parseName(bad?: string): NameNode {
    const {
      token: { value },
    } = takeToken("NAME");
    if (bad && value === bad) throw new Error(`Unexpected token "${bad}"`);
    return { kind: "Name", value };
  }

  function parseNamedType(): NamedTypeNode {
    return { kind: "NamedType", name: parseName() };
  }

  function parseType(): TypeNode {
    if (takeIfNextPunctuator("[").token) {
      const type = parseType();
      takePunctuator("]");

      const listType: ListTypeNode = { kind: "ListType", type };

      if (takeIfNextPunctuator("!").token) {
        return { kind: "NonNullType", type: listType };
      }

      return listType;
    }

    const name = parseNamedType();

    if (takeIfNextPunctuator("!").token) {
      return { kind: "NonNullType", type: name };
    }

    return name;
  }

  function parseVariable(): VariableNode {
    return {
      kind: "Variable",
      name: (takePunctuator("$"), parseName()),
    };
  }

  function parseValue(isConst: false): ValueNode;
  function parseValue(isConst: true): ValueConstNode;
  function parseValue(isConst: boolean): ValueNode | ValueConstNode {
    if (isNextPunctuator("$") && !isConst) return parseVariable();
    if (isNextPunctuator("[")) {
      return {
        kind: "ListValue",
        values: takeWrappedList<ValueNode | ValueConstNode>(
          false,
          "[",
          "]",
          () => (isConst ? parseValue(true) : parseValue(false))
        ),
      };
    }
    if (isNextPunctuator("{")) {
      return {
        kind: "ObjectValue",
        fields: takeWrappedList<ObjectFieldNode | ObjectFieldConstNode>(
          false,
          "{",
          "}",
          () => ({
            kind: "ObjectField",
            name: parseName(),
            value:
              (takePunctuator(":"),
              isConst ? parseValue(true) : parseValue(false)),
          })
        ),
      };
    }
    if (isNext("PUNCTUATOR")) throw new Error(`Unexpected token`);

    const { token } = tokens.peek();
    if (!token) throw new Error("Unexpected EOF");

    tokens.take();
    if (token.type === "INT_VALUE")
      return { kind: "IntValue", value: token.value };
    if (token.type === "FLOAT_VALUE")
      return { kind: "FloatValue", value: token.value };
    if (token.type === "STRING_VALUE")
      return { kind: "StringValue", value: token.value, block: false };
    if (token.type === "BLOCK_STRING_VALUE")
      return { kind: "StringValue", value: token.value, block: true };
    if (token.value === "true" || token.value === "false")
      return { kind: "BooleanValue", value: token.value === "true" };
    if (token.value === "null") return { kind: "NullValue" };
    return { kind: "EnumValue", value: token.value };
  }

  function parseArgs(isConst: false): ArgumentNode[];
  function parseArgs(isConst: true): ArgumentConstNode[];
  function parseArgs(isConst: boolean): ArgumentNode[] | ArgumentConstNode[] {
    return takeWrappedList<ArgumentNode | ArgumentConstNode>(
      true,
      "(",
      ")",
      () => ({
        kind: "Argument",
        name: parseName(),
        value:
          (takePunctuator(":"), isConst ? parseValue(true) : parseValue(false)),
      })
    );
  }

  function parseDirectives(isConst: false): DirectiveNode[];
  function parseDirectives(isConst: true): DirectiveConstNode[];
  function parseDirectives(
    isConst: boolean
  ): DirectiveNode[] | DirectiveConstNode[] {
    return takeList<DirectiveNode | DirectiveConstNode>(
      () => !!takeIfNextPunctuator("@").token,
      () => {
        return {
          kind: "Directive",
          name: parseName(),
          args: isConst ? parseArgs(true) : parseArgs(false),
        };
      }
    );
  }

  function parseTypeCondition(isOptional: false): NamedTypeNode;
  function parseTypeCondition(isOptional: true): NamedTypeNode | null;
  function parseTypeCondition(isOptional: boolean): NamedTypeNode | null {
    try {
      takeToken("NAME", "on");
    } catch (err) {
      if (!isOptional) throw err;
      return null;
    }
    return parseNamedType();
  }

  function parseSelectionSet(isOptional: boolean): SelectionNode[] {
    return takeWrappedList<SelectionNode>(isOptional, "{", "}", () => {
      if (takeIfNextPunctuator("...").token) {
        const { token } = tokens.peek();
        if (token && token.type === "NAME" && token.value !== "on") {
          return {
            kind: "FragmentSpread",
            name: parseName(),
            directives: parseDirectives(false),
          };
        }
        return {
          kind: "InlineFragment",
          typeCondition: parseTypeCondition(true),
          directives: parseDirectives(false),
          selectionSet: parseSelectionSet(false),
        };
      }

      let alias: NameNode | null = null;
      let name = parseName();

      if (takeIfNextPunctuator(":").token) {
        alias = name;
        name = parseName();
      }

      return {
        kind: "Field",
        alias,
        name,
        args: parseArgs(false),
        directives: parseDirectives(false),
        selectionSet: parseSelectionSet(true),
      };
    });
  }

  function parseOperationType(): OperationType {
    const {
      token: { value },
    } = takeToken("NAME");
    if (value !== "query" && value !== "mutation" && value !== "subscription")
      throw new Error(`Unexpected token "${value}"`);
    return value;
  }

  function parseInterfaces(): NamedTypeNode[] {
    return takeDelimitedList<NamedTypeNode>(
      "&",
      { type: "NAME", value: "implements" },
      () => parseNamedType()
    );
  }

  function parseDefaultValue(): ValueConstNode | null {
    try {
      takePunctuator("=");
    } catch {
      return null;
    }

    return parseValue(true);
  }

  function parseInputValueDefinitions(
    startPunctuator: string,
    endPunctuator: string
  ): InputValueDefinitionNode[] {
    return takeWrappedList<InputValueDefinitionNode>(
      true,
      startPunctuator,
      endPunctuator,
      () => ({
        kind: "InputValueDefinition",
        description: parseDescription(),
        name: parseName(),
        type: (takePunctuator(":"), parseType()),
        defaultValue: parseDefaultValue(),
        directives: parseDirectives(true),
      })
    );
  }

  function parseFieldDefinitions(): FieldDefinitionNode[] {
    return takeWrappedList<FieldDefinitionNode>(true, "{", "}", () => ({
      kind: "FieldDefinition",
      description: parseDescription(),
      name: parseName(),
      args: parseInputValueDefinitions("(", ")"),
      type: (takePunctuator(":"), parseType()),
      directives: parseDirectives(true),
    }));
  }

  function parseEnumValue(): EnumValueNode {
    const name = parseName();
    if (
      name.value === "null" ||
      name.value === "true" ||
      name.value === "false"
    )
      throw new Error(`Unexpected token "${name.value}"`);
    return { kind: "EnumValue", value: name.value };
  }

  function parseSchemaDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): SchemaDefinitionNode;
  function parseSchemaDefinition(
    isExtension: true,
    description?: undefined
  ): SchemaExtensionNode;
  function parseSchemaDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): SchemaDefinitionNode | SchemaExtensionNode {
    takeToken("NAME", "schema");
    const directives = parseDirectives(true);
    const operationTypes = takeWrappedList<OperationTypeDefinitionNode>(
      true,
      "{",
      "}",
      () => ({
        kind: "OperationTypeDefinition",
        operation: parseOperationType(),
        type: (takePunctuator(":"), parseNamedType()),
      })
    );
    if (isExtension)
      assertCombinedListLength([directives, operationTypes], "{");
    return isExtension
      ? {
          kind: "SchemaExtension",
          directives,
          operationTypes,
        }
      : {
          kind: "SchemaDefinition",
          description,
          directives,
          operationTypes,
        };
  }

  function parseScalarTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): ScalarTypeDefinitionNode;
  function parseScalarTypeDefinition(
    isExtension: true,
    description?: undefined
  ): ScalarTypeExtensionNode;
  function parseScalarTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): ScalarTypeDefinitionNode | ScalarTypeExtensionNode {
    takeToken("NAME", "scalar");
    const name = parseName();
    const directives = parseDirectives(true);
    if (isExtension) assertCombinedListLength([directives], "@");
    return isExtension
      ? { kind: "ScalarTypeExtension", name, directives }
      : { kind: "ScalarTypeDefinition", description, name, directives };
  }

  function parseObjectTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): ObjectTypeDefinitionNode;
  function parseObjectTypeDefinition(
    isExtension: true,
    description?: undefined
  ): ObjectTypeExtensionNode;
  function parseObjectTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): ObjectTypeDefinitionNode | ObjectTypeExtensionNode {
    takeToken("NAME", "type");
    const name = parseName();
    const interfaces = parseInterfaces();
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions();
    if (isExtension)
      assertCombinedListLength([interfaces, directives, fields], "{");
    return isExtension
      ? {
          kind: "ObjectTypeExtension",
          name,
          interfaces,
          directives,
          fields,
        }
      : {
          kind: "ObjectTypeDefinition",
          description,
          name,
          interfaces,
          directives,
          fields,
        };
  }

  function parseInterfaceTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): InterfaceTypeDefinitionNode;
  function parseInterfaceTypeDefinition(
    isExtension: true,
    description?: undefined
  ): InterfaceTypeExtensionNode;
  function parseInterfaceTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode {
    takeToken("NAME", "interface");
    const name = parseName();
    const interfaces = parseInterfaces();
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions();
    if (isExtension)
      assertCombinedListLength([interfaces, directives, fields], "{");
    return isExtension
      ? {
          kind: "InterfaceTypeExtension",
          name,
          interfaces,
          directives,
          fields,
        }
      : {
          kind: "InterfaceTypeDefinition",
          description,
          name,
          interfaces,
          directives,
          fields,
        };
  }

  function parseUnionTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): UnionTypeDefinitionNode;
  function parseUnionTypeDefinition(
    isExtension: true,
    description?: undefined
  ): UnionTypeExtensionNode;
  function parseUnionTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): UnionTypeDefinitionNode | UnionTypeExtensionNode {
    takeToken("NAME", "union");
    const name = parseName();
    const directives = parseDirectives(true);
    const types = takeDelimitedList<NamedTypeNode>(
      "|",
      { type: "PUNCTUATOR", value: "=" },
      () => parseNamedType()
    );
    if (isExtension) assertCombinedListLength([directives, types], "=");
    return isExtension
      ? { kind: "UnionTypeExtension", name, directives, types }
      : { kind: "UnionTypeDefinition", description, name, directives, types };
  }

  function parseEnumTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): EnumTypeDefinitionNode;
  function parseEnumTypeDefinition(
    isExtension: true,
    description?: undefined
  ): EnumTypeExtensionNode;
  function parseEnumTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): EnumTypeDefinitionNode | EnumTypeExtensionNode {
    takeToken("NAME", "enum");
    const name = parseName();
    const directives = parseDirectives(true);
    const values = takeWrappedList<EnumValueDefinitionNode>(
      true,
      "{",
      "}",
      () => ({
        kind: "EnumValueDefinition",
        description: parseDescription(),
        name: parseEnumValue(),
        directives: parseDirectives(true),
      })
    );
    if (isExtension) assertCombinedListLength([directives, values], "{");
    return isExtension
      ? { kind: "EnumTypeExtension", name, directives, values }
      : { kind: "EnumTypeDefinition", description, name, directives, values };
  }

  function parseInputObjectTypeDefinition(
    isExtension: false,
    description: StringValueNode | null
  ): InputObjectTypeDefinitionNode;
  function parseInputObjectTypeDefinition(
    isExtension: true,
    description?: undefined
  ): InputObjectTypeExtensionNode;
  function parseInputObjectTypeDefinition(
    isExtension: boolean,
    description: StringValueNode | null = null
  ): InputObjectTypeDefinitionNode | InputObjectTypeExtensionNode {
    takeToken("NAME", "input");
    const name = parseName();
    const directives = parseDirectives(true);
    const fields = parseInputValueDefinitions("{", "}");
    if (isExtension) assertCombinedListLength([directives, fields], "{");
    return isExtension
      ? {
          kind: "InputObjectTypeExtension",
          name,
          directives,
          fields,
        }
      : {
          kind: "InputObjectTypeDefinition",
          description,
          name,
          directives,
          fields,
        };
  }

  function parseTypeSystemExtension(): TypeSystemExtensionNode {
    takeToken("NAME", "extend");

    const {
      token: { value },
    } = assertToken("NAME");
    switch (value) {
      case "schema":
        return parseSchemaDefinition(true);
      case "scalar":
        return parseScalarTypeDefinition(true);
      case "type":
        return parseObjectTypeDefinition(true);
      case "interface":
        return parseInterfaceTypeDefinition(true);
      case "union":
        return parseUnionTypeDefinition(true);
      case "enum":
        return parseEnumTypeDefinition(true);
      case "input":
        return parseInputObjectTypeDefinition(true);
      default:
        throw new Error(`Unexpected token "${value}"`);
    }
  }

  function parseDefinition(): DefinitionNode {
    if (isNextPunctuator("{")) {
      return {
        kind: "OperationDefinition",
        operation: "query",
        name: null,
        variableDefinitions: [],
        directives: [],
        selectionSet: parseSelectionSet(false),
      };
    }

    const description = parseDescription();

    const {
      token: { value },
    } = assertToken("NAME");
    switch (value) {
      case "query":
      case "mutation":
      case "subscription":
        if (description !== null)
          throw new Error(`Unexpected token "${description}"`);
        return {
          kind: "OperationDefinition",
          operation: parseOperationType(),
          name: isNext("NAME") ? parseName() : null,
          variableDefinitions: takeWrappedList<VariableDefinitionNode>(
            true,
            "(",
            ")",
            () => ({
              kind: "VariableDefinition",
              variable: parseVariable(),
              type: (takePunctuator(":"), parseType()),
              defaultValue: parseDefaultValue(),
              directives: parseDirectives(true),
            })
          ),
          directives: parseDirectives(false),
          selectionSet: parseSelectionSet(false),
        };
      case "fragment":
        if (description !== null)
          throw new Error(`Unexpected token "${description}"`);
        return {
          kind: "FragmentDefinition",
          name: (takeToken("NAME", "fragment"), parseName("on")),
          typeCondition: parseTypeCondition(false),
          directives: parseDirectives(false),
          selectionSet: parseSelectionSet(false),
        };
      case "schema":
        return parseSchemaDefinition(false, description);
      case "scalar":
        return parseScalarTypeDefinition(false, description);
      case "type":
        return parseObjectTypeDefinition(false, description);
      case "interface":
        return parseInterfaceTypeDefinition(false, description);
      case "union":
        return parseUnionTypeDefinition(false, description);
      case "enum":
        return parseEnumTypeDefinition(false, description);
      case "input":
        return parseInputObjectTypeDefinition(false, description);
      case "directive":
        return {
          kind: "DirectiveDefinition",
          description,
          name:
            (takeToken("NAME", "directive"), takePunctuator("@"), parseName()),
          args: parseInputValueDefinitions("(", ")"),
          repeatable: isNext("NAME", "repeatable")
            ? (tokens.take(), true)
            : false,
          locations: takeDelimitedList<DirectiveLocationNode>(
            "|",
            { type: "NAME", value: "on" },
            () => {
              const value = takeToken("NAME").token.value as any;
              if (EXECUTABLE_DIRECTIVE_LOCATION.includes(value))
                return { kind: "ExecutableDirectiveLocation", value };
              if (TYPE_SYSTEM_DIRECTIVE_LOCATION.includes(value))
                return { kind: "TypeSystemDirectiveLocation", value };
              throw new Error(`Unexpected token "${value}"`);
            }
          ),
        };
      case "extend":
        if (description !== null) throw new Error("Unexpected token");
        return parseTypeSystemExtension();
      default:
        throw new Error(`Unexpected token "${value}"`);
    }
  }

  const definitions: DefinitionNode[] = [];
  while (tokens.peek().token) {
    definitions.push(parseDefinition());
  }

  return { kind: "Document", definitions };
}

class TokenStream {
  private iterator: IterableIterator<Token>;
  private next: Token | undefined;
  private nextNext: Token | undefined;
  private peekCache:
    | { token: Token | undefined; comments: Token[] }
    | undefined;

  constructor(source: string) {
    this.iterator = tokenize(source);

    /**
     * When the `peekCache` is empty, the `peek()` method requires the
     * following:
     * - `this.next` is set to the next token that is not consumed yet (this
     *   can be any token except for an inline-comment which would have already
     *   been consumed in the prevoius peek)
     * - `this.nextNext` is `undefined`
     *
     * When calling `take()` (which effectively empties the `peekCache`) we
     * restore this state by assigning the value of `this.nextNext` to
     * `this.next`.
     */
    this.next = this.iterator.next().value;
    this.nextNext = undefined;
    this.peekCache = undefined;
  }

  peek() {
    if (!this.peekCache) {
      this.peekCache = { token: undefined, comments: [] };

      let nextToken: Token | undefined = this.next;
      while (nextToken && nextToken.type === "COMMENT") {
        this.peekCache.comments.push(nextToken);
        nextToken = this.iterator.next().value;
      }

      this.peekCache.token = nextToken;

      this.nextNext = this.iterator.next().value;
      while (this.nextNext && this.nextNext.type === "INLINE_COMMENT") {
        this.peekCache.comments.push(this.nextNext);
        this.nextNext = this.iterator.next().value;
      }
    }
    return this.peekCache;
  }

  take() {
    const next = this.peek();
    this.next = this.nextNext;
    this.nextNext = undefined;
    this.peekCache = undefined;
    return next;
  }
}
