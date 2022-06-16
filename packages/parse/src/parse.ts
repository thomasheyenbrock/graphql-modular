import {
  ArgumentConstNode,
  ArgumentNode,
  CommentNode,
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
import { LexicalToken, Token, tokenize } from "./tokenize";

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
    let commentsOpenBracket: CommentNode[] = [];
    let commentsClosingBracket: CommentNode[] = [];
    try {
      commentsOpenBracket = takePunctuator(startPunctuator).comments;
    } catch (err) {
      if (isOptional)
        return {
          items: [],
          commentsOpenBracket: [],
          commentsClosingBracket: [],
        };
      throw err;
    }
    const items = takeList(() => {
      const { token, comments } = takeIfNextPunctuator(endPunctuator);
      if (token) commentsClosingBracket = comments;
      return !token;
    }, callback);
    return { items, commentsOpenBracket, commentsClosingBracket };
  }

  function takeDelimitedList<T>(
    delimiter: string,
    initializer: Token,
    callback: (comments: CommentNode[]) => T
  ) {
    const items: T[] = [];

    let initializerComments: CommentNode[] = [];
    try {
      initializerComments = takeToken(
        initializer.type,
        initializer.value
      ).comments;
    } catch {
      return { items, initializerComments: [] };
    }

    let comments: CommentNode[] = [];
    try {
      comments = takePunctuator(delimiter).comments;
    } catch {}

    items.push(callback(comments));

    let token: Token | undefined;
    while ((({ token, comments } = takeIfNextPunctuator(delimiter)), token)) {
      items.push(callback(comments));
    }

    return { items, initializerComments };
  }

  function parseDescription(): StringValueNode | null {
    const { token, comments } = tokens.peek();
    if (
      token &&
      (token.type === "STRING_VALUE" || token.type === "BLOCK_STRING_VALUE")
    ) {
      tokens.take();
      return {
        kind: "StringValue",
        value: token.value,
        block: token.type === "BLOCK_STRING_VALUE",
        comments,
      };
    }
    return null;
  }

  function parseName(bad?: string): NameNode {
    const {
      token: { value },
      comments,
    } = takeToken("NAME");
    if (bad && value === bad) throw new Error(`Unexpected token "${bad}"`);
    return { kind: "Name", comments, value };
  }

  function parseNamedType(): NamedTypeNode {
    const name = parseName();
    const comments = name.comments;
    name.comments = [];
    return { kind: "NamedType", name, comments };
  }

  function parseType(): TypeNode {
    const open = takeIfNextPunctuator("[");
    if (open.token) {
      const type = parseType();
      const close = takePunctuator("]");

      const listType: ListTypeNode = {
        kind: "ListType",
        type,
        comments: [...open.comments, ...type.comments, ...close.comments],
      };
      type.comments = [];

      const bang = takeIfNextPunctuator("!");
      if (bang.token) {
        const comments = [...listType.comments, ...bang.comments];
        listType.comments = [];
        return { kind: "NonNullType", type: listType, comments };
      }

      return listType;
    }

    const name = parseNamedType();

    const bang = takeIfNextPunctuator("!");
    if (bang.token) {
      const comments = [...name.comments, ...bang.comments];
      name.comments = [];
      return { kind: "NonNullType", type: name, comments };
    }

    return name;
  }

  function parseVariable(): VariableNode {
    const { comments } = takePunctuator("$");
    const name = parseName();
    comments.push(...name.comments);
    name.comments = [];
    return {
      kind: "Variable",
      name,
      comments,
    };
  }

  function parseValue(isConst: false): ValueNode;
  function parseValue(isConst: true): ValueConstNode;
  function parseValue(isConst: boolean): ValueNode | ValueConstNode {
    if (isNextPunctuator("$") && !isConst) return parseVariable();
    if (isNextPunctuator("[")) {
      const { items, commentsOpenBracket, commentsClosingBracket } =
        takeWrappedList<ValueNode | ValueConstNode>(false, "[", "]", () =>
          isConst ? parseValue(true) : parseValue(false)
        );
      return {
        kind: "ListValue",
        values: items,
        commentsOpenBracket,
        commentsClosingBracket,
      };
    }
    if (isNextPunctuator("{")) {
      const { items, commentsOpenBracket, commentsClosingBracket } =
        takeWrappedList<ObjectFieldNode | ObjectFieldConstNode>(
          false,
          "{",
          "}",
          () => {
            const name = parseName();
            const colon = takePunctuator(":");
            const value = isConst ? parseValue(true) : parseValue(false);
            const comments = [...name.comments, ...colon.comments];
            name.comments = [];
            return { kind: "ObjectField", name, value, comments };
          }
        );
      return {
        kind: "ObjectValue",
        fields: items,
        commentsOpenBracket,
        commentsClosingBracket,
      };
    }

    const { token, comments } = tokens.take();
    if (!token) throw new Error("Unexpected EOF");
    if (token.type === "PUNCTUATOR")
      throw new Error(`Unexpected token: ${token.value}`);
    if (token.type === "INT_VALUE")
      return { kind: "IntValue", value: token.value, comments };
    if (token.type === "FLOAT_VALUE")
      return { kind: "FloatValue", value: token.value, comments };
    if (token.type === "STRING_VALUE")
      return {
        kind: "StringValue",
        value: token.value,
        block: false,
        comments,
      };
    if (token.type === "BLOCK_STRING_VALUE")
      return { kind: "StringValue", value: token.value, block: true, comments };
    if (token.value === "true" || token.value === "false")
      return { kind: "BooleanValue", value: token.value === "true", comments };
    if (token.value === "null") return { kind: "NullValue", comments };
    return { kind: "EnumValue", value: token.value, comments };
  }

  function parseArgs(isConst: false): {
    items: ArgumentNode[];
    commentsOpenBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  };
  function parseArgs(isConst: true): {
    items: ArgumentConstNode[];
    commentsOpenBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  };
  function parseArgs(isConst: boolean): {
    items: ArgumentNode[] | ArgumentConstNode[];
    commentsOpenBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  } {
    return takeWrappedList<ArgumentNode | ArgumentConstNode>(
      true,
      "(",
      ")",
      () => {
        const name = parseName();
        const colon = takePunctuator(":");
        const value = isConst ? parseValue(true) : parseValue(false);
        const comments = [...name.comments, ...colon.comments];
        return { kind: "Argument", name, value, comments };
      }
    );
  }

  function parseDirectives(isConst: false): DirectiveNode[];
  function parseDirectives(isConst: true): DirectiveConstNode[];
  function parseDirectives(
    isConst: boolean
  ): DirectiveNode[] | DirectiveConstNode[] {
    return takeList<DirectiveNode | DirectiveConstNode>(
      () => isNextPunctuator("@"),
      () => {
        const at = takePunctuator("@");
        const name = parseName();
        const args = isConst ? parseArgs(true) : parseArgs(false);
        const comments = [
          ...at.comments,
          ...name.comments,
          ...args.commentsOpenBracket,
          ...args.commentsClosingBracket,
        ];
        name.comments = [];
        return { kind: "Directive", name, args: args.items, comments };
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
        args: parseArgs(false).items, // TODO: this returns comments
        directives: parseDirectives(false),
        selectionSet: parseSelectionSet(true),
      };
    }).items; // TODO: this returns comments
  }

  function parseOperationType(): OperationType {
    const {
      token: { value },
    } = takeToken("NAME");
    if (value !== "query" && value !== "mutation" && value !== "subscription")
      throw new Error(`Unexpected token "${value}"`);
    return value;
  }

  function parseInterfaces(): {
    items: NamedTypeNode[];
    initializerComments: CommentNode[];
  } {
    return takeDelimitedList<NamedTypeNode>(
      "&",
      { type: "NAME", value: "implements" },
      (comments) => {
        const type = parseNamedType();
        type.comments.unshift(...comments);
        return type;
      }
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
  ): {
    items: InputValueDefinitionNode[];
    commentsOpenBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  } {
    return takeWrappedList<InputValueDefinitionNode>(
      true,
      startPunctuator,
      endPunctuator,
      () => {
        const description = parseDescription();
        const name = parseName();
        const colon = takePunctuator(":");
        const type = parseType();
        const defaultValue = parseDefaultValue();
        const directives = parseDirectives(true);
        const comments = [...name.comments, ...colon.comments];
        name.comments = [];
        return {
          kind: "InputValueDefinition",
          description,
          name,
          type,
          defaultValue,
          directives,
          comments,
        };
      }
    );
  }

  function parseFieldDefinitions(): {
    items: FieldDefinitionNode[];
    commentsOpenBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  } {
    return takeWrappedList<FieldDefinitionNode>(true, "{", "}", () => {
      const description = parseDescription();
      const name = parseName();
      const args = parseInputValueDefinitions("(", ")");
      const colon = takePunctuator(":");
      const type = parseType();
      const directives = parseDirectives(true);
      const comments = [
        ...name.comments,
        ...colon.comments,
        ...args.commentsOpenBracket,
        ...args.commentsClosingBracket,
      ];
      return {
        kind: "FieldDefinition",
        description,
        name,
        args: args.items,
        type,
        directives,
        comments,
      };
    });
  }

  function parseEnumValue(): EnumValueNode {
    const name = parseName();
    if (
      name.value === "null" ||
      name.value === "true" ||
      name.value === "false"
    )
      throw new Error(`Unexpected token "${name.value}"`);
    return { kind: "EnumValue", value: name.value, comments: name.comments };
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
    ).items; // TODO: this returns comments
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
    const interfaces = parseInterfaces().items; // TODO: this return comments
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions().items; // TODO: this returns comments
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
    const interfaces = parseInterfaces().items; // TODO: this returns comments
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions().items; // TODO: this returns comments
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
      (comments) => {
        const type = parseNamedType();
        type.comments.unshift(...comments);
        return type;
      }
    ).items; // TODO: this returns comments
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
    ).items; // TODO: this returns comments
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
    const fields = parseInputValueDefinitions("{", "}"); // TODO: this returns comments
    if (isExtension) assertCombinedListLength([directives, fields.items], "{");
    return isExtension
      ? {
          kind: "InputObjectTypeExtension",
          name,
          directives,
          fields: fields.items,
        }
      : {
          kind: "InputObjectTypeDefinition",
          description,
          name,
          directives,
          fields: fields.items,
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
            () => {
              const variable = parseVariable();
              const colon = takePunctuator(":");
              const type = parseType();
              const defaultValue = parseDefaultValue();
              const directives = parseDirectives(true);
              const comments = [...variable.comments, ...colon.comments];
              variable.comments = [];
              return {
                kind: "VariableDefinition",
                variable,
                type,
                defaultValue,
                directives,
                comments,
              };
            }
          ).items, // TODO: this returns comments
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
          args: parseInputValueDefinitions("(", ")").items, // TODO: this returns comments
          repeatable: isNext("NAME", "repeatable")
            ? (tokens.take(), true)
            : false,
          locations: takeDelimitedList<DirectiveLocationNode>(
            "|",
            { type: "NAME", value: "on" },
            (delimiterComments) => {
              const name = takeToken("NAME");
              const value = name.token.value as any;
              const comments = [...delimiterComments, ...name.comments];
              if (EXECUTABLE_DIRECTIVE_LOCATION.includes(value))
                return { kind: "ExecutableDirectiveLocation", value, comments };
              if (TYPE_SYSTEM_DIRECTIVE_LOCATION.includes(value))
                return { kind: "TypeSystemDirectiveLocation", value, comments };
              throw new Error(`Unexpected token "${value}"`);
            }
          ).items, // TODO: this returns comments
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
  private next: LexicalToken | undefined;
  private nextNext: LexicalToken | undefined;
  private peekCache:
    | { token: LexicalToken | undefined; comments: CommentNode[] }
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
      while (nextToken && nextToken.type === "BLOCK_COMMENT") {
        this.peekCache.comments.push({
          kind: "BlockComment",
          value: nextToken.value,
        });
        nextToken = this.iterator.next().value;
      }

      this.peekCache.token = nextToken as LexicalToken;

      let nextNext: Token | undefined = this.iterator.next().value;
      while (nextNext && nextNext.type === "INLINE_COMMENT") {
        this.peekCache.comments.push({
          kind: "InlineComment",
          value: nextNext.value,
        });
        nextNext = this.iterator.next().value;
      }
      this.nextNext = nextNext as LexicalToken;
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
