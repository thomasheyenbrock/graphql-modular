import {
  BooleanValueNode,
  EnumTypeDefinitionNode,
  EnumValueNode,
  EXECUTABLE_DIRECTIVE_LOCATION,
  FieldNode,
  FloatValueNode,
  InputObjectTypeDefinitionNode,
  IntValueNode,
  ListTypeNode,
  ListValueNode,
  NonNullTypeNode,
  NullValueNode,
  ObjectTypeDefinitionNode,
  ObjectValueNode,
  OperationDefinitionNode,
  StringValueNode,
} from "@graphql-modular/language";
import fs from "fs";
import { DocumentNode, parse as _parseGql, visit } from "graphql";
import path from "path";
import { describe, expect, it } from "vitest";
import { parse } from "./parse";

const LANGUAGE = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "language.gql"),
  "utf8"
);

const KITCHEN_SINK = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "kitchenSink.gql"),
  "utf8"
);

it("parses the kitchen sink query", () => {
  const ast = parse(KITCHEN_SINK);
  stripComments(ast);
  expect(ast).toEqual(parseGql(KITCHEN_SINK));
});

it("parses all language features", () => {
  const ast = parse(LANGUAGE);
  stripComments(ast);
  expect(ast).toEqual(parseGql(LANGUAGE));
});

it("parses comments for variables", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    query Foo(
      # comment before
      $
      # comment between
      id # comment after
      : ID
    ) {
      id
    }
  `);
  const { variable } = (ast.definitions[0] as OperationDefinitionNode)
    .variableDefinitions[0];
  expect(variable.comments).toEqual([
    { kind: "BlockComment", value: "comment before" },
    { kind: "BlockComment", value: "comment between" },
    { kind: "InlineComment", value: "comment after" },
  ]);
  expect(variable.name.comments).toEqual([]);
});

describe("parsing comments for values", () => {
  it("parses comments for int values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          intArg: 
          # comment int before
          42 # comment int after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as IntValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment int before" },
      { kind: "InlineComment", value: "comment int after" },
    ]);
  });
  it("parses comments for float values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          floatArg:
          # comment float before
          42.43e44 # comment float after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as FloatValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment float before" },
      { kind: "InlineComment", value: "comment float after" },
    ]);
  });
  it("parses comments for string values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          stringArg:
          # comment string before
          "some string" # comment string after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as StringValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment string before" },
      { kind: "InlineComment", value: "comment string after" },
    ]);
  });
  it("parses comments for boolean values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          booleanArg:
          # comment boolean before
          true # comment boolean after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as BooleanValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment boolean before" },
      { kind: "InlineComment", value: "comment boolean after" },
    ]);
  });
  it("parses comments for null values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          nullArg:
          # comment null before
          null # comment null after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as NullValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment null before" },
      { kind: "InlineComment", value: "comment null after" },
    ]);
  });
  it("parses comments for enum values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          enumArg:
          # comment enum before
          SOME_ENUM # comment enum after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as EnumValueNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment enum before" },
      { kind: "InlineComment", value: "comment enum after" },
    ]);
  });
  it("parses comments for list values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          listArg:
          # comment list open before
          [ # comment list open after
            1,2,3
          # comment list close before
          ] # comment list close after
        )
      }
    `);
    const value = (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FieldNode
    ).args[0].value as ListValueNode;
    expect(value.commentsOpenBracket).toEqual([
      { kind: "BlockComment", value: "comment list open before" },
      { kind: "InlineComment", value: "comment list open after" },
    ]);
    expect(value.commentsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment list close before" },
      { kind: "InlineComment", value: "comment list close after" },
    ]);
  });
  it("parses comments for object values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo {
        id(
          objectArg:
          # comment object open before
          { # comment object open after
            # comment object field before
            someField # comment object field after
            # comment colon before
            : # comment colon after
            # comment value before
            42 # comment value after
          # comment object close before
          } # comment object close after
        )
      }
    `);
    const value = (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FieldNode
    ).args[0].value as ObjectValueNode;
    expect(value.commentsOpenBracket).toEqual([
      { kind: "BlockComment", value: "comment object open before" },
      { kind: "InlineComment", value: "comment object open after" },
    ]);
    expect(value.commentsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment object close before" },
      { kind: "InlineComment", value: "comment object close after" },
    ]);
    expect(value.fields[0].comments).toEqual([
      { kind: "BlockComment", value: "comment object field before" },
      { kind: "InlineComment", value: "comment object field after" },
      { kind: "BlockComment", value: "comment colon before" },
      { kind: "InlineComment", value: "comment colon after" },
    ]);
  });
});

it("parses comments for descriptions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment before
    "some description" # comment after
    type Foo {
      id: ID
    }
  `);
  const { description } = ast.definitions[0] as ObjectTypeDefinitionNode;
  expect(description?.comments).toEqual([
    { kind: "BlockComment", value: "prettier-ignore\ncomment before" },
    { kind: "InlineComment", value: "comment after" },
  ]);
});

it("parses comments for enum values", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    enum Foo {
      # comment before
      ABC # comment after
    }
  `);
  const { name } = (ast.definitions[0] as EnumTypeDefinitionNode).values[0];
  expect(name.comments).toEqual([
    { kind: "BlockComment", value: "comment before" },
    { kind: "InlineComment", value: "comment after" },
  ]);
});

describe("comments for types", () => {
  it("parses comments for named types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        name: 
        # comment name before
        ID # comment name after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
  });
  it("parses comments for non-null types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        nonNull:
        # comment name before
        ID # comment name after
        # comment bang before
        ! # comment bang after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment bang before" },
      { kind: "InlineComment", value: "comment bang after" },
    ]);
    expect((type as NonNullTypeNode).type.comments).toEqual([]);
  });
  it("parses comments for list types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        list:
        # comment open before
        [ # comment open after
        # comment name before
        ID # comment name after
        # comment close before
        ] # comment close after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment open before" },
      { kind: "InlineComment", value: "comment open after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment close before" },
      { kind: "InlineComment", value: "comment close after" },
    ]);
    expect((type as ListTypeNode).type.comments).toEqual([]);
  });
  it("parses comments for list-non-null types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        listNonNull:
        # comment open before
        [ # comment open after
        # comment name before
        ID # comment name after
        # comment bang before
        ! # comment bang after
        # comment close before
        ] # comment close after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment open before" },
      { kind: "InlineComment", value: "comment open after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment bang before" },
      { kind: "InlineComment", value: "comment bang after" },
      { kind: "BlockComment", value: "comment close before" },
      { kind: "InlineComment", value: "comment close after" },
    ]);
    expect((type as ListTypeNode).type.comments).toEqual([]);
  });
  it("parses comments for non-null-list types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        nonNullList:
        # comment open before
        [ # comment open after
        # comment name before
        ID # comment name after
        # comment close before
        ] # comment close after
        # comment bang before
        ! # comment bang after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment open before" },
      { kind: "InlineComment", value: "comment open after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment close before" },
      { kind: "InlineComment", value: "comment close after" },
      { kind: "BlockComment", value: "comment bang before" },
      { kind: "InlineComment", value: "comment bang after" },
    ]);
    expect((type as NonNullTypeNode).type.comments).toEqual([]);
  });
  it("parses comments for non-null-list-non-null types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        nonNullListNonNull:
        # comment open before
        [ # comment open after
        # comment name before
        ID # comment name after
        # comment bang before
        ! # comment bang after
        # comment close before
        ] # comment close after
        # comment bang before
        ! # comment bang after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment open before" },
      { kind: "InlineComment", value: "comment open after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment bang before" },
      { kind: "InlineComment", value: "comment bang after" },
      { kind: "BlockComment", value: "comment close before" },
      { kind: "InlineComment", value: "comment close after" },
      { kind: "BlockComment", value: "comment bang before" },
      { kind: "InlineComment", value: "comment bang after" },
    ]);
    expect((type as NonNullTypeNode).type.comments).toEqual([]);
  });
  it("parses comments for nested list types", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        nestedList:
        # comment open outer before
        [ # comment open outer after
        # comment open inner before
        [ # comment open inner after
        # comment name before
        ID # comment name after
        # comment close inner before
        ] # comment close inner after
        # comment close outer before
        ] # comment close outer after
      }
    `);
    const { type } = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(type.comments).toEqual([
      { kind: "BlockComment", value: "comment open outer before" },
      { kind: "InlineComment", value: "comment open outer after" },
      { kind: "BlockComment", value: "comment open inner before" },
      { kind: "InlineComment", value: "comment open inner after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment close inner before" },
      { kind: "InlineComment", value: "comment close inner after" },
      { kind: "BlockComment", value: "comment close outer before" },
      { kind: "InlineComment", value: "comment close outer after" },
    ]);
    expect((type as ListTypeNode).type.comments).toEqual([]);
  });
});

it("parses comments for input value definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    input Foo {
      # comment description before
      "some description" # comment description after
      # comment name before
      field # comment name after
      # comment colon before
      : # comment colon after
      # comment type before
      ID # comment type after
      # comment equal sign before
      = # comment equal sign after
      # comment value before
      "unique-id" # comment value after
      # comment directive 1 before
      @someDirective # comment directive 1 after
      # comment directive 2 before
      @someOtherDirective # comment directive 2 after
    }
  `);
  const field = (ast.definitions[0] as InputObjectTypeDefinitionNode).fields[0];
  expect(field.comments).toEqual([
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
    { kind: "BlockComment", value: "comment colon before" },
    { kind: "InlineComment", value: "comment colon after" },
  ]);
});

it("parses comments for field definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    type Foo {
      # comment description before
      "some description" # comment description after
      # comment name before
      field # comment name after
      # comment args open before
      ( # comment args open after
        # comment description arg 1 before
        "some description" # comment description arg 1 after
        # comment name arg 1 before
        field # comment name arg 1 after
        # comment colon arg 1 before
        : # comment colon arg 1 after
        # comment type arg 1 before
        ID # comment type arg 1 after
        # comment equal sign arg 1 before
        = # comment equal sign arg 1 after
        # comment value arg 1 before
        "unique-id" # comment value arg 1 after
        # comment directive 1 arg 1 before
        @someDirective # comment directive 1 arg 1 after
        # comment directive 2 arg 1 before
        @someOtherDirective # comment directive 2 arg 1 after
        # comment name arg 2 before
        field2 # comment name arg 2 after
        # comment colon arg 2 before
        : # comment colon arg 2 after
        # comment type arg 2 before
        Int # comment type arg 2 after
      # comment args close before
      ) # comment args close after
      # comment colon before
      : # comment colon after
      # comment type before
      ID # comment type after
      # comment directive 1 before
      @someDirective # comment directive 1 after
      # comment directive 2 before
      @someOtherDirective # comment directive 2 after
    }
  `);
  const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
  expect(field.comments).toEqual([
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
    { kind: "BlockComment", value: "comment colon before" },
    { kind: "InlineComment", value: "comment colon after" },
    { kind: "BlockComment", value: "comment args open before" },
    { kind: "InlineComment", value: "comment args open after" },
    { kind: "BlockComment", value: "comment args close before" },
    { kind: "InlineComment", value: "comment args close after" },
  ]);
});

it("parses comments for arguments", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    {
      # comment field before
      field # comment field after
      # comment args open before
      ( # comment args open after
        # comment arg name before
        argName # comment arg name after
        # comment colon before
        : # comment colon after
        # comment arg value before
        42 # comment arg value after
      # comment args close before
      ) # comment args close after
    }
  `);
  expect(
    (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FieldNode
    ).args[0].comments
  ).toEqual([
    { kind: "BlockComment", value: "comment arg name before" },
    { kind: "InlineComment", value: "comment arg name after" },
    { kind: "BlockComment", value: "comment colon before" },
    { kind: "InlineComment", value: "comment colon after" },
  ]);
});

it("parses comments for directives", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    {
      # comment field before
      field # comment field after
      # comment at 1 before
      @ # comment at 1 after
      # comment directive 1 before
      someDirective # comment directive 1 after
      # comment args open before
      ( # comment args open after
        # comment arg name before
        arg # comment arg name before
        # comment colon before
        : # comment colon before
        # comment arg type before
        Int # comment arg type before
      # comment args close before
      ) # comment args close after
      # comment at 2 before
      @ # comment at 2 after
      # comment directive 2 before
      someOtherDirective # comment directive 2 after
    }
  `);
  const { directives } = (ast.definitions[0] as OperationDefinitionNode)
    .selectionSet[0] as FieldNode;
  expect(directives[0].comments).toEqual([
    { kind: "BlockComment", value: "comment at 1 before" },
    { kind: "InlineComment", value: "comment at 1 after" },
    { kind: "BlockComment", value: "comment directive 1 before" },
    { kind: "InlineComment", value: "comment directive 1 after" },
    { kind: "BlockComment", value: "comment args open before" },
    { kind: "InlineComment", value: "comment args open after" },
    { kind: "BlockComment", value: "comment args close before" },
    { kind: "InlineComment", value: "comment args close after" },
  ]);
  expect(directives[1].comments).toEqual([
    { kind: "BlockComment", value: "comment at 2 before" },
    { kind: "InlineComment", value: "comment at 2 after" },
    { kind: "BlockComment", value: "comment directive 2 before" },
    { kind: "InlineComment", value: "comment directive 2 after" },
  ]);
});

// TODO: add assertion functions to handle union types

it.skip("timing", () => {
  let start = Date.now();
  for (let i = 0; i < 10; i++) parse(LANGUAGE);
  const time = Date.now() - start;

  start = Date.now();
  for (let i = 0; i < 10; i++) _parseGql(LANGUAGE, { noLocation: true });
  const compare = Date.now() - start;

  expect(time).toBeLessThan(compare);
});

function parseGql(source: string): DocumentNode {
  const ast = _parseGql(source, { noLocation: true });
  return visit(ast, {
    Directive: {
      leave({ arguments: args, ...restNode }) {
        /** we always use "args" as key instead of "arguments" */
        return { args, ...restNode };
      },
    },
    DirectiveDefinition: {
      leave({ arguments: args, description, locations, ...restNode }) {
        return {
          ...restNode,
          /** we always use "args" as key instead of "arguments" */
          args,
          /** null instead of undefined */
          description: description ?? null,
          /**
           * we use a separate node with strongly typed values instead of the
           * generic NameNode
           */
          locations: locations.map((location) => ({
            kind: EXECUTABLE_DIRECTIVE_LOCATION.includes(location.value as any)
              ? "ExecutableDirectiveLocation"
              : "TypeSystemDirectiveLocation",
            value: location.value,
          })),
        };
      },
    },
    EnumTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    EnumValueDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
          /** name uses kind EnumValue */
          name: { ...node.name, kind: "EnumValue" },
        };
      },
    },
    Field: {
      leave({ alias, arguments: args, selectionSet, ...restNode }) {
        return {
          ...restNode,
          /** null instead of undefined */
          alias: alias ?? null,
          /** we always use "args" as key instead of "arguments" */
          args,
          /** Empty selection set is empty array */
          selectionSet: selectionSet ?? [],
        };
      },
    },
    FieldDefinition: {
      leave({ arguments: args, description, ...restNode }) {
        return {
          ...restNode,
          /** null instead of undefined */
          description: description ?? null,
          /** we always use "args" as key instead of "arguments" */
          args,
        };
      },
    },
    InlineFragment: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          typeCondition: node.typeCondition ?? null,
        };
      },
    },
    InputObjectTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    InputValueDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          defaultValue: node.defaultValue ?? null,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    InterfaceTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    ObjectTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    OperationDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          name: node.name ?? null,
        };
      },
    },
    ScalarTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    SchemaDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    /** No selection set but just a list of selections */
    SelectionSet: {
      leave(node) {
        return node.selections;
      },
    },
    UnionTypeDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          description: node.description ?? null,
        };
      },
    },
    VariableDefinition: {
      leave(node) {
        return {
          ...node,
          /** null instead of undefined */
          defaultValue: node.defaultValue ?? null,
        };
      },
    },
  });
}

function stripComments(obj: any) {
  if (Array.isArray(obj)) return obj.forEach(stripComments);
  if (!obj || typeof obj !== "object") return;
  delete obj.comments;
  delete obj.commentsOpenBracket;
  delete obj.commentsClosingBracket;
  Object.values(obj).forEach(stripComments);
}
