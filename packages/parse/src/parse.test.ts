import {
  BooleanValueNode,
  DirectiveDefinitionNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  EnumValueNode,
  EXECUTABLE_DIRECTIVE_LOCATION,
  FieldNode,
  FloatValueNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  InputObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  IntValueNode,
  ListTypeNode,
  ListValueNode,
  NonNullTypeNode,
  NullValueNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  ObjectValueNode,
  OperationDefinitionNode,
  ScalarTypeDefinitionNode,
  ScalarTypeExtensionNode,
  SchemaDefinitionNode,
  SchemaExtensionNode,
  StringValueNode,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
  VariableNode,
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

it("parsing comments for variables", () => {
  it("parses comments for variables in values", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        id(
          arg:
          # comment dollar before
          $ # comment dollar after
          # comment name before
          someVariable # comment name after
        )
      }
    `);
    expect(
      (
        (
          (ast.definitions[0] as OperationDefinitionNode)
            .selectionSet[0] as FieldNode
        ).args[0].value as VariableNode
      ).comments
    ).toEqual([
      { kind: "BlockComment", value: "comment dollar before" },
      { kind: "InlineComment", value: "comment dollar after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
  });
  it("parses no comments for variables in variable definitions", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      query Foo(
        # comment dollar before
        $ # comment dollar after
        # comment name before
        id # comment name after
        : ID
      ) {
        id
      }
    `);
    const { variable } = (ast.definitions[0] as OperationDefinitionNode)
      .variableDefinitions[0];
    expect(variable.comments).toEqual([]);
  });
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
    expect(value.commentsOpeningBracket).toEqual([
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
    expect(value.commentsOpeningBracket).toEqual([
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

it("parses comments for enum value definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    enum Foo {
      # comment before
      ABC # comment after
    }
  `);
  const value = (ast.definitions[0] as EnumTypeDefinitionNode).values[0];
  expect(value.comments).toEqual([
    { kind: "BlockComment", value: "comment before" },
    { kind: "InlineComment", value: "comment after" },
  ]);
  expect(value.name.comments).toEqual([]);
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

describe("parsing comments for field definitions", () => {
  it("parses comments for field definitions without arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        # comment description before
        "some description" # comment description after
        # comment name before
        field # comment name after
        # comment colon before
        : # comment colon after
        # comment type before
        ID # comment type after
      }
    `);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment colon before" },
      { kind: "InlineComment", value: "comment colon after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([]);
    expect(field.commentsArgsClosingBracket).toEqual([]);
  });
  it("parses comments for field definitions with arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      type Foo {
        # comment description before
        "some description" # comment description after
        # comment name before
        field # comment name after
        # comment args open before
        ( # comment args open after
          field: ID
        # comment args close before
        ) # comment args close after
        # comment colon before
        : # comment colon after
        # comment type before
        ID # comment type after
      }
    `);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields[0];
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
      { kind: "BlockComment", value: "comment colon before" },
      { kind: "InlineComment", value: "comment colon after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment args open before" },
      { kind: "InlineComment", value: "comment args open after" },
    ]);
    expect(field.commentsArgsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment args close before" },
      { kind: "InlineComment", value: "comment args close after" },
    ]);
  });
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

describe("parsing comments for directives", () => {
  it("parses comments for directives without arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        field
        # comment at before
        @ # comment at after
        # comment directive before
        someOtherDirective # comment directive after
      }
    `);
    const directive = (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FieldNode
    ).directives[0];
    expect(directive.comments).toEqual([
      { kind: "BlockComment", value: "comment at before" },
      { kind: "InlineComment", value: "comment at after" },
      { kind: "BlockComment", value: "comment directive before" },
      { kind: "InlineComment", value: "comment directive after" },
    ]);
    expect(directive.commentsArgsOpeningBracket).toEqual([]);
    expect(directive.commentsArgsClosingBracket).toEqual([]);
  });
  it("parses comments for directives with arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment field before
        field # comment field after
        # comment at before
        @ # comment at after
        # comment directive before
        someDirective # comment directive after
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
      }
    `);
    const directive = (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FieldNode
    ).directives[0];
    expect(directive.comments).toEqual([
      { kind: "BlockComment", value: "comment at before" },
      { kind: "InlineComment", value: "comment at after" },
      { kind: "BlockComment", value: "comment directive before" },
      { kind: "InlineComment", value: "comment directive after" },
    ]);
    expect(directive.commentsArgsOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment args open before" },
      { kind: "InlineComment", value: "comment args open after" },
    ]);
    expect(directive.commentsArgsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment args close before" },
      { kind: "InlineComment", value: "comment args close after" },
    ]);
  });
});

describe("parsing comments for interface implementations", () => {
  it("parses comments for a single interface implementation", () => {
    const ast = parse(`
      # prettier-ignore
      type Foo implements
      # comment before
      SomeInterface # comment after
    `);
    expect(
      (ast.definitions[0] as ObjectTypeDefinitionNode).interfaces[0].comments
    ).toEqual([
      { kind: "BlockComment", value: "comment before" },
      { kind: "InlineComment", value: "comment after" },
    ]);
  });
  it("parses comments for multiple interface implementations", () => {
    const ast = parse(`
      # prettier-ignore
      type Foo implements
      # comment name 1 before
      SomeInterface1 # comment name 1 after
      # comment delimiter 2 before
      & # comment delimiter 2 after
      # comment name 2 before
      SomeInterface2 # comment name 2 after
      # comment delimiter 3 before
      & # comment delimiter 3 after
      # comment name 3 before
      SomeInterface3 # comment name 3 after
    `);
    const { interfaces } = ast.definitions[0] as ObjectTypeDefinitionNode;
    expect(interfaces[0].comments).toEqual([
      { kind: "BlockComment", value: "comment name 1 before" },
      { kind: "InlineComment", value: "comment name 1 after" },
    ]);
    expect(interfaces[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment name 2 before" },
      { kind: "InlineComment", value: "comment name 2 after" },
    ]);
    expect(interfaces[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment name 3 before" },
      { kind: "InlineComment", value: "comment name 3 after" },
    ]);
  });
  it("parses comments for multiple interface implementations with leading delimiter", () => {
    const ast = parse(`
      # prettier-ignore
      type Foo implements
      # comment delimiter 1 before
      & # comment delimiter 1 after
      # comment name 1 before
      SomeInterface1 # comment name 1 after
      # comment delimiter 2 before
      & # comment delimiter 2 after
      # comment name 2 before
      SomeInterface2 # comment name 2 after
      # comment delimiter 3 before
      & # comment delimiter 3 after
      # comment name 3 before
      SomeInterface3 # comment name 3 after
    `);
    const { interfaces } = ast.definitions[0] as ObjectTypeDefinitionNode;
    expect(interfaces[0].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 1 before" },
      { kind: "InlineComment", value: "comment delimiter 1 after" },
      { kind: "BlockComment", value: "comment name 1 before" },
      { kind: "InlineComment", value: "comment name 1 after" },
    ]);
    expect(interfaces[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment name 2 before" },
      { kind: "InlineComment", value: "comment name 2 after" },
    ]);
    expect(interfaces[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment name 3 before" },
      { kind: "InlineComment", value: "comment name 3 after" },
    ]);
  });
});

describe("parsing comments for union type members", () => {
  it("parses comments for a single member", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      union Foo =
      # comment before
      SomeType # comment after
    `);
    expect(
      (ast.definitions[0] as UnionTypeDefinitionNode).types[0].comments
    ).toEqual([
      { kind: "BlockComment", value: "comment before" },
      { kind: "InlineComment", value: "comment after" },
    ]);
  });
  it("parses comments for multiple members", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      union Foo =
      # comment name 1 before
      SomeType1 # comment name 1 after
      # comment delimiter 2 before
      | # comment delimiter 2 after
      # comment name 2 before
      SomeType2 # comment name 2 after
      # comment delimiter 3 before
      | # comment delimiter 3 after
      # comment name 3 before
      SomeType3 # comment name 3 after
    `);
    const { types } = ast.definitions[0] as UnionTypeDefinitionNode;
    expect(types[0].comments).toEqual([
      { kind: "BlockComment", value: "comment name 1 before" },
      { kind: "InlineComment", value: "comment name 1 after" },
    ]);
    expect(types[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment name 2 before" },
      { kind: "InlineComment", value: "comment name 2 after" },
    ]);
    expect(types[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment name 3 before" },
      { kind: "InlineComment", value: "comment name 3 after" },
    ]);
  });
  it("parses comments for multiple members with leading delimiter", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      union Foo =
      # comment delimiter 1 before
      | # comment delimiter 1 after
      # comment name 1 before
      SomeType1 # comment name 1 after
      # comment delimiter 2 before
      | # comment delimiter 2 after
      # comment name 2 before
      SomeType2 # comment name 2 after
      # comment delimiter 3 before
      | # comment delimiter 3 after
      # comment name 3 before
      SomeType3 # comment name 3 after
    `);
    const { types } = ast.definitions[0] as UnionTypeDefinitionNode;
    expect(types[0].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 1 before" },
      { kind: "InlineComment", value: "comment delimiter 1 after" },
      { kind: "BlockComment", value: "comment name 1 before" },
      { kind: "InlineComment", value: "comment name 1 after" },
    ]);
    expect(types[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment name 2 before" },
      { kind: "InlineComment", value: "comment name 2 after" },
    ]);
    expect(types[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment name 3 before" },
      { kind: "InlineComment", value: "comment name 3 after" },
    ]);
  });
});

describe("parsing comments for directive locations", () => {
  it("parses comments for a single directive location", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      directive @foo on
      # comment before
      QUERY # comment after
    `);
    expect(
      (ast.definitions[0] as DirectiveDefinitionNode).locations[0].comments
    ).toEqual([
      { kind: "BlockComment", value: "comment before" },
      { kind: "InlineComment", value: "comment after" },
    ]);
  });
  it("parses comments for multiple directive locations", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      directive @foo on
      # comment location 1 before
      QUERY # comment location 1 after
      # comment delimiter 2 before
      | # comment delimiter 2 after
      # comment location 2 before
      MUTATION # comment location 2 after
      # comment delimiter 3 before
      | # comment delimiter 3 after
      # comment location 3 before
      SUBSCRIPTION # comment location 3 after
    `);
    const { locations } = ast.definitions[0] as DirectiveDefinitionNode;
    expect(locations[0].comments).toEqual([
      { kind: "BlockComment", value: "comment location 1 before" },
      { kind: "InlineComment", value: "comment location 1 after" },
    ]);
    expect(locations[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment location 2 before" },
      { kind: "InlineComment", value: "comment location 2 after" },
    ]);
    expect(locations[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment location 3 before" },
      { kind: "InlineComment", value: "comment location 3 after" },
    ]);
  });
  it("parses comments for multiple directive locations with leading delimiter", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      directive @foo on
      # comment delimiter 1 before
      | # comment delimiter 1 after
      # comment location 1 before
      QUERY # comment location 1 after
      # comment delimiter 2 before
      | # comment delimiter 2 after
      # comment location 2 before
      MUTATION # comment location 2 after
      # comment delimiter 3 before
      | # comment delimiter 3 after
      # comment location 3 before
      SUBSCRIPTION # comment location 3 after
    `);
    const { locations } = ast.definitions[0] as DirectiveDefinitionNode;
    expect(locations[0].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 1 before" },
      { kind: "InlineComment", value: "comment delimiter 1 after" },
      { kind: "BlockComment", value: "comment location 1 before" },
      { kind: "InlineComment", value: "comment location 1 after" },
    ]);
    expect(locations[1].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 2 before" },
      { kind: "InlineComment", value: "comment delimiter 2 after" },
      { kind: "BlockComment", value: "comment location 2 before" },
      { kind: "InlineComment", value: "comment location 2 after" },
    ]);
    expect(locations[2].comments).toEqual([
      { kind: "BlockComment", value: "comment delimiter 3 before" },
      { kind: "InlineComment", value: "comment delimiter 3 after" },
      { kind: "BlockComment", value: "comment location 3 before" },
      { kind: "InlineComment", value: "comment location 3 after" },
    ]);
  });
});

describe("parsing comments for directive definitions", () => {
  it("parses comments for directive definitions without arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      # comment keyword before
      directive # comment keyword after
      # comment at before
      @ # comment at after
      # comment name before
      foo # comment name after
      # comment on before
      on # comment on after
      # comment location before
      QUERY # comment location after
    `);
    const definition = ast.definitions[0] as DirectiveDefinitionNode;
    expect(definition.comments).toEqual([
      {
        kind: "BlockComment",
        value: "prettier-ignore\ncomment keyword before",
      },
      { kind: "InlineComment", value: "comment keyword after" },
      { kind: "BlockComment", value: "comment at before" },
      { kind: "InlineComment", value: "comment at after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(definition.commentsArgsOpeningBracket).toEqual([]);
    expect(definition.commentsArgsClosingBracket).toEqual([]);
    expect(definition.commentsLocations).toEqual([
      { kind: "BlockComment", value: "comment on before" },
      { kind: "InlineComment", value: "comment on after" },
    ]);
  });
  it("parses comments for directive definitions with arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      # comment keyword before
      directive # comment keyword after
      # comment at before
      @ # comment at after
      # comment name before
      foo # comment name after
      # comment args open before
      ( # comment args open after
        foo: Int
      # comment args close before
      ) # comment args close after
      # comment on before
      on # comment on after
      # comment location before
      QUERY # comment location after
    `);
    const definition = ast.definitions[0] as DirectiveDefinitionNode;
    expect(definition.comments).toEqual([
      {
        kind: "BlockComment",
        value: "prettier-ignore\ncomment keyword before",
      },
      { kind: "InlineComment", value: "comment keyword after" },
      { kind: "BlockComment", value: "comment at before" },
      { kind: "InlineComment", value: "comment at after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(definition.commentsArgsOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment args open before" },
      { kind: "InlineComment", value: "comment args open after" },
    ]);
    expect(definition.commentsArgsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment args close before" },
      { kind: "InlineComment", value: "comment args close after" },
    ]);
    expect(definition.commentsLocations).toEqual([
      { kind: "BlockComment", value: "comment on before" },
      { kind: "InlineComment", value: "comment on after" },
    ]);
  });
});

it("parses comments for input object type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    input # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as InputObjectTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for input object type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    input # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as InputObjectTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for enum type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    enum # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment values open before
    { # comment values open after
      ENUM_VALUE
    # comment values close before
    } # comment values close after
  `);
  const definition = ast.definitions[0] as EnumTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsValuesOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment values open before" },
    { kind: "InlineComment", value: "comment values open after" },
  ]);
  expect(definition.commentsValuesClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment values close before" },
    { kind: "InlineComment", value: "comment values close after" },
  ]);
});

it("parses comments for enum type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    enum # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment values open before
    { # comment values open after
      ENUM_VALUE
    # comment values close before
    } # comment values close after
  `);
  const definition = ast.definitions[0] as EnumTypeExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsValuesOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment values open before" },
    { kind: "InlineComment", value: "comment values open after" },
  ]);
  expect(definition.commentsValuesClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment values close before" },
    { kind: "InlineComment", value: "comment values close after" },
  ]);
});

it("parses comments for union type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    union # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment types before
    = # comment types after
      SomeType
  `);
  const definition = ast.definitions[0] as UnionTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsTypes).toEqual([
    { kind: "BlockComment", value: "comment types before" },
    { kind: "InlineComment", value: "comment types after" },
  ]);
});

it("parses comments for union type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    union # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment types before
    = # comment types after
      SomeType
  `);
  const definition = ast.definitions[0] as UnionTypeExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsTypes).toEqual([
    { kind: "BlockComment", value: "comment types before" },
    { kind: "InlineComment", value: "comment types after" },
  ]);
});

it("parses comments for interface type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    interface # comment keyword after
    # comment name before
    Foo # comment name after
    # comment implements before
    implements # comment implements after
      Bar
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as InterfaceTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsInterfaces).toEqual([
    { kind: "BlockComment", value: "comment implements before" },
    { kind: "InlineComment", value: "comment implements after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for interface type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    interface # comment keyword after
    # comment name before
    Foo # comment name after
    # comment implements before
    implements # comment implements after
      Bar
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as InterfaceTypeExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsInterfaces).toEqual([
    { kind: "BlockComment", value: "comment implements before" },
    { kind: "InlineComment", value: "comment implements after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for object type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    type # comment keyword after
    # comment name before
    Foo # comment name after
    # comment implements before
    implements # comment implements after
      Bar
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as ObjectTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsInterfaces).toEqual([
    { kind: "BlockComment", value: "comment implements before" },
    { kind: "InlineComment", value: "comment implements after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for object type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    type # comment keyword after
    # comment name before
    Foo # comment name after
    # comment implements before
    implements # comment implements after
      Bar
    # comment directive before
    @foo # comment directive after
    # comment fields open before
    { # comment fields open after
      foo: Int
    # comment fields close before
    } # comment fields close after
  `);
  const definition = ast.definitions[0] as ObjectTypeExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
  expect(definition.commentsInterfaces).toEqual([
    { kind: "BlockComment", value: "comment implements before" },
    { kind: "InlineComment", value: "comment implements after" },
  ]);
  expect(definition.commentsFieldsOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment fields open before" },
    { kind: "InlineComment", value: "comment fields open after" },
  ]);
  expect(definition.commentsFieldsClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment fields close before" },
    { kind: "InlineComment", value: "comment fields close after" },
  ]);
});

it("parses comments for scalar type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    scalar # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
    # comment fields open before
  `);
  const definition = ast.definitions[0] as ScalarTypeDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
});

it("parses comments for scalar type extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    scalar # comment keyword after
    # comment name before
    Foo # comment name after
    # comment directive before
    @foo # comment directive after
  `);
  const definition = ast.definitions[0] as ScalarTypeExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
});

it("parses comments for operation type definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    schema {
      # comment operation type before
      query # comment operation type after
      # comment colon before
      : # comment colon after
      # comment type before
      Root # comment type after
    }
  `);
  expect(
    (ast.definitions[0] as SchemaDefinitionNode).operationTypes[0].comments
  ).toEqual([
    { kind: "BlockComment", value: "comment colon before" },
    { kind: "InlineComment", value: "comment colon after" },
  ]);
});

it("parses comments for schema definitions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment keyword before
    schema # comment keyword after
    # comment directive before
    @foo # comment directive after
    # comment operation types open before
    { # comment operation types open after
      query: Root
    # comment operation types close before
    } # comment operation types close after
  `);
  const definition = ast.definitions[0] as SchemaDefinitionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment keyword before",
    },
    { kind: "InlineComment", value: "comment keyword after" },
  ]);
  expect(definition.commentsOperationTypesOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment operation types open before" },
    { kind: "InlineComment", value: "comment operation types open after" },
  ]);
  expect(definition.commentsOperationTypesClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment operation types close before" },
    { kind: "InlineComment", value: "comment operation types close after" },
  ]);
});

it("parses comments for schema extensions", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    # comment extend before
    extend # comment extend after
    # comment keyword before
    schema # comment keyword after
    # comment directive before
    @foo # comment directive after
    # comment operation types open before
    { # comment operation types open after
      query: Root
    # comment operation types close before
    } # comment operation types close after
  `);
  const definition = ast.definitions[0] as SchemaExtensionNode;
  expect(definition.comments).toEqual([
    {
      kind: "BlockComment",
      value: "prettier-ignore\ncomment extend before",
    },
    { kind: "InlineComment", value: "comment extend after" },
    { kind: "BlockComment", value: "comment keyword before" },
    { kind: "InlineComment", value: "comment keyword after" },
  ]);
  expect(definition.commentsOperationTypesOpeningBracket).toEqual([
    { kind: "BlockComment", value: "comment operation types open before" },
    { kind: "InlineComment", value: "comment operation types open after" },
  ]);
  expect(definition.commentsOperationTypesClosingBracket).toEqual([
    { kind: "BlockComment", value: "comment operation types close before" },
    { kind: "InlineComment", value: "comment operation types close after" },
  ]);
});

describe("parsing comments for inline fragments", () => {
  it("parses comments for inline fragments without type condition", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment spread before
        ... # comment spread after
        # comment directive before
        @foo # comment directive after
        # comment selection set open before
        { # comment selection set open after
          id
          # comment selection set close before
        } # comment selection set close after
      }
    `);
    const inlineFragment = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as InlineFragmentNode;
    expect(inlineFragment.comments).toEqual([
      { kind: "BlockComment", value: "comment spread before" },
      { kind: "InlineComment", value: "comment spread after" },
    ]);
    expect(inlineFragment.commentsSelectionSetOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set open before" },
      { kind: "InlineComment", value: "comment selection set open after" },
    ]);
    expect(inlineFragment.commentsSelectionSetClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set close before" },
      { kind: "InlineComment", value: "comment selection set close after" },
    ]);
  });
  it("parses comments for inline fragments without type condition", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment spread before
        ... # comment spread after
        # comment type condition before
        on # comment type condition after
        # comment type before
        Foo # comment type after
        # comment directive before
        @foo # comment directive after
        # comment selection set open before
        { # comment selection set open after
          id
          # comment selection set close before
        } # comment selection set close after
      }
    `);
    const inlineFragment = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as InlineFragmentNode;
    expect(inlineFragment.comments).toEqual([
      { kind: "BlockComment", value: "comment spread before" },
      { kind: "InlineComment", value: "comment spread after" },
      { kind: "BlockComment", value: "comment type condition before" },
      { kind: "InlineComment", value: "comment type condition after" },
    ]);
    expect(inlineFragment.commentsSelectionSetOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set open before" },
      { kind: "InlineComment", value: "comment selection set open after" },
    ]);
    expect(inlineFragment.commentsSelectionSetClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set close before" },
      { kind: "InlineComment", value: "comment selection set close after" },
    ]);
  });
});

it("parses comments for fragment spreads", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    {
      # comment spread before
      ... # comment spread after
      # comment name before
      SomeFragment # comment name after
      # comment directive before
      @foo # comment directive after
    }
  `);
  expect(
    (
      (ast.definitions[0] as OperationDefinitionNode)
        .selectionSet[0] as FragmentSpreadNode
    ).comments
  ).toEqual([
    { kind: "BlockComment", value: "comment spread before" },
    { kind: "InlineComment", value: "comment spread after" },
    { kind: "BlockComment", value: "comment name before" },
    { kind: "InlineComment", value: "comment name after" },
  ]);
});

describe("parsing comments for fields", () => {
  it("parses comments for leaf fields without arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment name before
        field # comment name after
        # comment directive before
        @foo # comment directive after
      }
    `);
    const field = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as FieldNode;
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([]);
    expect(field.commentsArgsClosingBracket).toEqual([]);
    expect(field.commentsSelectionSetOpeningBracket).toEqual([]);
    expect(field.commentsSelectionSetClosingBracket).toEqual([]);
  });
  it("parses comments for leaf fields with arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment name before
        field # comment name after
        # comment args open before
        ( # comment args open after
          arg: 42
        # comment args close before
        ) # comment args close after
        # comment directive before
        @foo # comment directive after
      }
    `);
    const field = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as FieldNode;
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment args open before" },
      { kind: "InlineComment", value: "comment args open after" },
    ]);
    expect(field.commentsArgsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment args close before" },
      { kind: "InlineComment", value: "comment args close after" },
    ]);
    expect(field.commentsSelectionSetOpeningBracket).toEqual([]);
    expect(field.commentsSelectionSetClosingBracket).toEqual([]);
  });
  it("parses comments for non-leaf fields without arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment name before
        field # comment name after
        # comment directive before
        @foo # comment directive after
        # comment selection set open before
        { # comment selection set open after
          subField
        # comment selection set close before
        } # comment selection set close after
      }
    `);
    const field = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as FieldNode;
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([]);
    expect(field.commentsArgsClosingBracket).toEqual([]);
    expect(field.commentsSelectionSetOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set open before" },
      { kind: "InlineComment", value: "comment selection set open after" },
    ]);
    expect(field.commentsSelectionSetClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set close before" },
      { kind: "InlineComment", value: "comment selection set close after" },
    ]);
  });
  it("parses comments for non-leaf fields with arguments", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment name before
        field # comment name after
        # comment args open before
        ( # comment args open after
          arg: 42
        # comment args close before
        ) # comment args close after
        # comment directive before
        @foo # comment directive after
        # comment selection set open before
        { # comment selection set open after
          subField
        # comment selection set close before
        } # comment selection set close after
      }
    `);
    const field = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as FieldNode;
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment args open before" },
      { kind: "InlineComment", value: "comment args open after" },
    ]);
    expect(field.commentsArgsClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment args close before" },
      { kind: "InlineComment", value: "comment args close after" },
    ]);
    expect(field.commentsSelectionSetOpeningBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set open before" },
      { kind: "InlineComment", value: "comment selection set open after" },
    ]);
    expect(field.commentsSelectionSetClosingBracket).toEqual([
      { kind: "BlockComment", value: "comment selection set close before" },
      { kind: "InlineComment", value: "comment selection set close after" },
    ]);
  });
  it("parses comments for fields with alias", () => {
    const ast = parse(/* GraphQL */ `
      # prettier-ignore
      {
        # comment alias before
        alias # comment alias after
        # comment colon before
        : # comment colon after
        # comment name before
        field # comment name after
        # comment directive before
        @foo # comment directive after
      }
    `);
    const field = (ast.definitions[0] as OperationDefinitionNode)
      .selectionSet[0] as FieldNode;
    expect(field.comments).toEqual([
      { kind: "BlockComment", value: "comment alias before" },
      { kind: "InlineComment", value: "comment alias after" },
      { kind: "BlockComment", value: "comment colon before" },
      { kind: "InlineComment", value: "comment colon after" },
      { kind: "BlockComment", value: "comment name before" },
      { kind: "InlineComment", value: "comment name after" },
    ]);
    expect(field.commentsArgsOpeningBracket).toEqual([]);
    expect(field.commentsArgsClosingBracket).toEqual([]);
    expect(field.commentsSelectionSetOpeningBracket).toEqual([]);
    expect(field.commentsSelectionSetClosingBracket).toEqual([]);
  });
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
  delete obj.commentsOpeningBracket;
  delete obj.commentsClosingBracket;
  delete obj.commentsSelectionSetOpeningBracket;
  delete obj.commentsSelectionSetClosingBracket;
  delete obj.commentsArgsOpeningBracket;
  delete obj.commentsArgsClosingBracket;
  delete obj.commentsFieldsOpeningBracket;
  delete obj.commentsFieldsClosingBracket;
  delete obj.commentsValuesOpeningBracket;
  delete obj.commentsValuesClosingBracket;
  delete obj.commentsOperationTypesOpeningBracket;
  delete obj.commentsOperationTypesClosingBracket;
  delete obj.commentsInterfaces;
  delete obj.commentsTypes;
  delete obj.commentsLocations;
  Object.values(obj).forEach(stripComments);
}
