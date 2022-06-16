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
    let commentsOpeningBracket: CommentNode[] = [];
    let commentsClosingBracket: CommentNode[] = [];
    try {
      commentsOpeningBracket = takePunctuator(startPunctuator).comments;
    } catch (err) {
      if (isOptional)
        return {
          items: [],
          commentsOpeningBracket: [],
          commentsClosingBracket: [],
        };
      throw err;
    }
    const items = takeList(() => {
      const { token, comments } = takeIfNextPunctuator(endPunctuator);
      if (token) commentsClosingBracket = comments;
      return !token;
    }, callback);
    return { items, commentsOpeningBracket, commentsClosingBracket };
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
      const { items, commentsOpeningBracket, commentsClosingBracket } =
        takeWrappedList<ValueNode | ValueConstNode>(false, "[", "]", () =>
          isConst ? parseValue(true) : parseValue(false)
        );
      return {
        kind: "ListValue",
        values: items,
        commentsOpeningBracket,
        commentsClosingBracket,
      };
    }
    if (isNextPunctuator("{")) {
      const { items, commentsOpeningBracket, commentsClosingBracket } =
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
        commentsOpeningBracket,
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
    commentsOpeningBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  };
  function parseArgs(isConst: true): {
    items: ArgumentConstNode[];
    commentsOpeningBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  };
  function parseArgs(isConst: boolean): {
    items: ArgumentNode[] | ArgumentConstNode[];
    commentsOpeningBracket: CommentNode[];
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
        const comments = [...at.comments, ...name.comments];
        name.comments = [];
        return {
          kind: "Directive",
          name,
          args: args.items,
          comments,
          commentsArgsOpeningBracket: args.commentsOpeningBracket,
          commentsArgsClosingBracket: args.commentsClosingBracket,
        };
      }
    );
  }

  function parseTypeCondition(isOptional: false): {
    type: NamedTypeNode;
    comments: CommentNode[];
  };
  function parseTypeCondition(
    isOptional: true
  ): { type: NamedTypeNode; comments: CommentNode[] } | null;
  function parseTypeCondition(
    isOptional: boolean
  ): { type: NamedTypeNode; comments: CommentNode[] } | null {
    let comments: CommentNode[] = [];
    try {
      comments = takeToken("NAME", "on").comments;
    } catch (err) {
      if (!isOptional) throw err;
      return null;
    }
    return { type: parseNamedType(), comments };
  }

  function parseSelectionSet(isOptional: boolean): {
    items: SelectionNode[];
    commentsOpeningBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  } {
    return takeWrappedList<SelectionNode>(isOptional, "{", "}", () => {
      const spread = takeIfNextPunctuator("...");
      if (spread.token) {
        const { token } = tokens.peek();
        if (token && token.type === "NAME" && token.value !== "on") {
          const name = parseName();
          const directives = parseDirectives(false);
          const comments = [...spread.comments, ...name.comments];
          name.comments = [];
          return { kind: "FragmentSpread", name, directives, comments };
        }
        const typeCondition = parseTypeCondition(true);
        const directives = parseDirectives(false);
        const selectionSet = parseSelectionSet(false);
        const comments = [
          ...spread.comments,
          ...(typeCondition ? typeCondition.comments : []),
        ];
        return {
          kind: "InlineFragment",
          typeCondition: typeCondition?.type || null,
          directives,
          selectionSet: selectionSet.items,
          comments,
          commentsSelectionSetOpeningBracket:
            selectionSet.commentsOpeningBracket,
          commentsSelectionSetClosingBracket:
            selectionSet.commentsClosingBracket,
        };
      }

      let alias: NameNode | null = null;
      let name = parseName();

      const colon = takeIfNextPunctuator(":");
      if (colon.token) {
        alias = name;
        name = parseName();
      }

      const args = parseArgs(false);
      const directives = parseDirectives(false);
      const selectionSet = parseSelectionSet(true);

      const comments = [
        ...(alias ? alias.comments : []),
        ...colon.comments,
        ...name.comments,
      ];

      return {
        kind: "Field",
        alias,
        name,
        args: args.items,
        directives,
        selectionSet: selectionSet.items,
        comments,
        commentsArgsOpeningBracket: args.commentsOpeningBracket,
        commentsArgsClosingBracket: args.commentsClosingBracket,
        commentsSelectionSetOpeningBracket: selectionSet.commentsOpeningBracket,
        commentsSelectionSetClosingBracket: selectionSet.commentsClosingBracket,
      };
    });
  }

  function parseOperationType(): {
    value: OperationType;
    comments: CommentNode[];
  } {
    const {
      token: { value },
      comments,
    } = takeToken("NAME");
    if (value !== "query" && value !== "mutation" && value !== "subscription")
      throw new Error(`Unexpected token "${value}"`);
    return { value, comments };
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
    commentsOpeningBracket: CommentNode[];
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
    commentsOpeningBracket: CommentNode[];
    commentsClosingBracket: CommentNode[];
  } {
    return takeWrappedList<FieldDefinitionNode>(true, "{", "}", () => {
      const description = parseDescription();
      const name = parseName();
      const args = parseInputValueDefinitions("(", ")");
      const colon = takePunctuator(":");
      const type = parseType();
      const directives = parseDirectives(true);
      const comments = [...name.comments, ...colon.comments];
      return {
        kind: "FieldDefinition",
        description,
        name,
        args: args.items,
        type,
        directives,
        comments,
        commentsArgsOpeningBracket: args.commentsOpeningBracket,
        commentsArgsClosingBracket: args.commentsClosingBracket,
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
    extendComments: null,
    description: StringValueNode | null
  ): SchemaDefinitionNode;
  function parseSchemaDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): SchemaExtensionNode;
  function parseSchemaDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): SchemaDefinitionNode | SchemaExtensionNode {
    const keyword = takeToken("NAME", "schema");
    const directives = parseDirectives(true);
    const operationTypes = takeWrappedList<OperationTypeDefinitionNode>(
      true,
      "{",
      "}",
      () => {
        const operation = parseOperationType();
        const colon = takePunctuator(":");
        const type = parseNamedType();
        return {
          kind: "OperationTypeDefinition",
          operation: operation.value,
          type,
          comments: [...operation.comments, ...colon.comments],
        };
      }
    );
    const comments = [...(extendComments || []), ...keyword.comments];
    if (extendComments)
      assertCombinedListLength([directives, operationTypes.items], "{");
    return extendComments
      ? {
          kind: "SchemaExtension",
          directives,
          operationTypes: operationTypes.items,
          comments,
          commentsOperationTypesOpeningBracket:
            operationTypes.commentsOpeningBracket,
          commentsOperationTypesClosingBracket:
            operationTypes.commentsClosingBracket,
        }
      : {
          kind: "SchemaDefinition",
          description,
          directives,
          operationTypes: operationTypes.items,
          comments,
          commentsOperationTypesOpeningBracket:
            operationTypes.commentsOpeningBracket,
          commentsOperationTypesClosingBracket:
            operationTypes.commentsClosingBracket,
        };
  }

  function parseScalarTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): ScalarTypeDefinitionNode;
  function parseScalarTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): ScalarTypeExtensionNode;
  function parseScalarTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): ScalarTypeDefinitionNode | ScalarTypeExtensionNode {
    const keyword = takeToken("NAME", "scalar");
    const name = parseName();
    const directives = parseDirectives(true);
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments) assertCombinedListLength([directives], "@");
    return extendComments
      ? {
          kind: "ScalarTypeExtension",
          name,
          directives,
          comments,
        }
      : {
          kind: "ScalarTypeDefinition",
          description,
          name,
          directives,
          comments,
        };
  }

  function parseObjectTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): ObjectTypeDefinitionNode;
  function parseObjectTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): ObjectTypeExtensionNode;
  function parseObjectTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): ObjectTypeDefinitionNode | ObjectTypeExtensionNode {
    const keyword = takeToken("NAME", "type");
    const name = parseName();
    const interfaces = parseInterfaces();
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions();
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments)
      assertCombinedListLength(
        [interfaces.items, directives, fields.items],
        "{"
      );
    return extendComments
      ? {
          kind: "ObjectTypeExtension",
          name,
          interfaces: interfaces.items,
          directives,
          fields: fields.items,
          comments,
          commentsInterfaces: interfaces.initializerComments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        }
      : {
          kind: "ObjectTypeDefinition",
          description,
          name,
          interfaces: interfaces.items,
          directives,
          fields: fields.items,
          comments,
          commentsInterfaces: interfaces.initializerComments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        };
  }

  function parseInterfaceTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): InterfaceTypeDefinitionNode;
  function parseInterfaceTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): InterfaceTypeExtensionNode;
  function parseInterfaceTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode {
    const keyword = takeToken("NAME", "interface");
    const name = parseName();
    const interfaces = parseInterfaces();
    const directives = parseDirectives(true);
    const fields = parseFieldDefinitions();
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments)
      assertCombinedListLength(
        [interfaces.items, directives, fields.items],
        "{"
      );
    return extendComments
      ? {
          kind: "InterfaceTypeExtension",
          name,
          interfaces: interfaces.items,
          directives,
          fields: fields.items,
          comments,
          commentsInterfaces: interfaces.initializerComments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        }
      : {
          kind: "InterfaceTypeDefinition",
          description,
          name,
          interfaces: interfaces.items,
          directives,
          fields: fields.items,
          comments,
          commentsInterfaces: interfaces.initializerComments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        };
  }

  function parseUnionTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): UnionTypeDefinitionNode;
  function parseUnionTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): UnionTypeExtensionNode;
  function parseUnionTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): UnionTypeDefinitionNode | UnionTypeExtensionNode {
    const keyword = takeToken("NAME", "union");
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
    );
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments)
      assertCombinedListLength([directives, types.items], "=");
    return extendComments
      ? {
          kind: "UnionTypeExtension",
          name,
          directives,
          types: types.items,
          comments,
          commentsTypes: types.initializerComments,
        }
      : {
          kind: "UnionTypeDefinition",
          description,
          name,
          directives,
          types: types.items,
          comments,
          commentsTypes: types.initializerComments,
        };
  }

  function parseEnumTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): EnumTypeDefinitionNode;
  function parseEnumTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): EnumTypeExtensionNode;
  function parseEnumTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): EnumTypeDefinitionNode | EnumTypeExtensionNode {
    const keyword = takeToken("NAME", "enum");
    const name = parseName();
    const directives = parseDirectives(true);
    const values = takeWrappedList<EnumValueDefinitionNode>(
      true,
      "{",
      "}",
      () => {
        const description = parseDescription();
        const name = parseEnumValue();
        const directives = parseDirectives(true);
        const comments = name.comments;
        name.comments = [];
        return {
          kind: "EnumValueDefinition",
          description,
          name,
          directives,
          comments,
        };
      }
    );
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments)
      assertCombinedListLength([directives, values.items], "{");
    return extendComments
      ? {
          kind: "EnumTypeExtension",
          name,
          directives,
          values: values.items,
          comments,
          commentsValuesOpeningBracket: values.commentsOpeningBracket,
          commentsValuesClosingBracket: values.commentsClosingBracket,
        }
      : {
          kind: "EnumTypeDefinition",
          description,
          name,
          directives,
          values: values.items,
          comments,
          commentsValuesOpeningBracket: values.commentsOpeningBracket,
          commentsValuesClosingBracket: values.commentsClosingBracket,
        };
  }

  function parseInputObjectTypeDefinition(
    extendComments: null,
    description: StringValueNode | null
  ): InputObjectTypeDefinitionNode;
  function parseInputObjectTypeDefinition(
    extendComments: CommentNode[],
    description?: undefined
  ): InputObjectTypeExtensionNode;
  function parseInputObjectTypeDefinition(
    extendComments: CommentNode[] | null,
    description: StringValueNode | null = null
  ): InputObjectTypeDefinitionNode | InputObjectTypeExtensionNode {
    const keyword = takeToken("NAME", "input");
    const name = parseName();
    const directives = parseDirectives(true);
    const fields = parseInputValueDefinitions("{", "}");
    const comments = [
      ...(extendComments || []),
      ...keyword.comments,
      ...name.comments,
    ];
    name.comments = [];
    if (extendComments)
      assertCombinedListLength([directives, fields.items], "{");
    return extendComments
      ? {
          kind: "InputObjectTypeExtension",
          name,
          directives,
          fields: fields.items,
          comments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        }
      : {
          kind: "InputObjectTypeDefinition",
          description,
          name,
          directives,
          fields: fields.items,
          comments,
          commentsFieldsOpeningBracket: fields.commentsOpeningBracket,
          commentsFieldsClosingBracket: fields.commentsClosingBracket,
        };
  }

  function parseTypeSystemExtension(): TypeSystemExtensionNode {
    const { comments } = takeToken("NAME", "extend");

    const {
      token: { value },
    } = assertToken("NAME");
    switch (value) {
      case "schema":
        return parseSchemaDefinition(comments);
      case "scalar":
        return parseScalarTypeDefinition(comments);
      case "type":
        return parseObjectTypeDefinition(comments);
      case "interface":
        return parseInterfaceTypeDefinition(comments);
      case "union":
        return parseUnionTypeDefinition(comments);
      case "enum":
        return parseEnumTypeDefinition(comments);
      case "input":
        return parseInputObjectTypeDefinition(comments);
      default:
        throw new Error(`Unexpected token "${value}"`);
    }
  }

  function parseDefinition(): DefinitionNode {
    if (isNextPunctuator("{")) {
      const selectionSet = parseSelectionSet(false);
      return {
        kind: "OperationDefinition",
        operation: "query",
        name: null,
        variableDefinitions: [],
        directives: [],
        selectionSet: selectionSet.items,
        comments: [],
        commentsVariableDefinitionsOpeningBracket: [],
        commentsVariableDefinitionsClosingBracket: [],
        commentsSelectionSetOpeningBracket: selectionSet.commentsOpeningBracket,
        commentsSelectionSetClosingBracket: selectionSet.commentsClosingBracket,
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
        const operation = parseOperationType();
        const name = isNext("NAME") ? parseName() : null;
        const variableDefinitions = takeWrappedList<VariableDefinitionNode>(
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
        );
        const directives = parseDirectives(false);
        const selectionSet = parseSelectionSet(false);
        const comments = [
          ...operation.comments,
          ...(name ? name.comments : []),
        ];
        return {
          kind: "OperationDefinition",
          operation: operation.value,
          name,
          variableDefinitions: variableDefinitions.items,
          directives,
          selectionSet: selectionSet.items,
          comments,
          commentsVariableDefinitionsOpeningBracket:
            variableDefinitions.commentsOpeningBracket,
          commentsVariableDefinitionsClosingBracket:
            variableDefinitions.commentsClosingBracket,
          commentsSelectionSetOpeningBracket:
            selectionSet.commentsOpeningBracket,
          commentsSelectionSetClosingBracket:
            selectionSet.commentsClosingBracket,
        };
      case "fragment": {
        if (description !== null)
          throw new Error(`Unexpected token "${description}"`);
        const keyword = takeToken("NAME", "fragment");
        const name = parseName("on");
        const typeCondition = parseTypeCondition(false);
        const directives = parseDirectives(false);
        const selectionSet = parseSelectionSet(false);
        const comments = [
          ...keyword.comments,
          ...name.comments,
          ...typeCondition.comments,
        ];
        name.comments = [];
        return {
          kind: "FragmentDefinition",
          name,
          typeCondition: typeCondition.type,
          directives,
          selectionSet: selectionSet.items,
          comments,
          commentsSelectionSetOpeningBracket:
            selectionSet.commentsOpeningBracket,
          commentsSelectionSetClosingBracket:
            selectionSet.commentsClosingBracket,
        };
      }
      case "schema":
        return parseSchemaDefinition(null, description);
      case "scalar":
        return parseScalarTypeDefinition(null, description);
      case "type":
        return parseObjectTypeDefinition(null, description);
      case "interface":
        return parseInterfaceTypeDefinition(null, description);
      case "union":
        return parseUnionTypeDefinition(null, description);
      case "enum":
        return parseEnumTypeDefinition(null, description);
      case "input":
        return parseInputObjectTypeDefinition(null, description);
      case "directive": {
        const keyword = takeToken("NAME", "directive");
        const at = takePunctuator("@");
        const name = parseName();
        const args = parseInputValueDefinitions("(", ")");
        const repeatable = isNext("NAME", "repeatable")
          ? (tokens.take(), true)
          : false;
        const locations = takeDelimitedList<DirectiveLocationNode>(
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
        );
        const comments = [
          ...keyword.comments,
          ...at.comments,
          ...name.comments,
        ];
        name.comments = [];
        return {
          kind: "DirectiveDefinition",
          description,
          name,
          args: args.items,
          repeatable,
          locations: locations.items,
          comments,
          commentsArgsOpeningBracket: args.commentsOpeningBracket,
          commentsArgsClosingBracket: args.commentsClosingBracket,
          commentsLocations: locations.initializerComments,
        };
      }
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
