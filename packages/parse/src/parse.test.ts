import {
  BooleanValueNode,
  EnumTypeDefinitionNode,
  EnumValueNode,
  EXECUTABLE_DIRECTIVE_LOCATION,
  FieldNode,
  FloatValueNode,
  IntValueNode,
  NullValueNode,
  ObjectTypeDefinitionNode,
  OperationDefinitionNode,
  StringValueNode,
} from "@graphql-modular/language";
import fs from "fs";
import { DocumentNode, parse as _parseGql, visit } from "graphql";
import path from "path";
import { expect, it } from "vitest";
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

it("parses comments for value nodes", () => {
  const ast = parse(/* GraphQL */ `
    # prettier-ignore
    query Foo {
      id(
        intArg: 
        # comment int before
        42 # comment int after
        floatArg:
        # comment float before
        42.43e44 # comment float after
        stringArg:
        # comment string before
        "some string" # comment string after
        booleanArg:
        # comment boolean before
        true # comment boolean after
        nullArg:
        # comment null before
        null # comment null after
        enumArg:
        # comment enum before
        SOME_ENUM # comment enum after
      )
    }
  `);
  const { args } = (ast.definitions[0] as OperationDefinitionNode)
    .selectionSet[0] as FieldNode;
  expect((args[0].value as IntValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment int before" },
    { kind: "InlineComment", value: "comment int after" },
  ]);
  expect((args[1].value as FloatValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment float before" },
    { kind: "InlineComment", value: "comment float after" },
  ]);
  expect((args[2].value as StringValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment string before" },
    { kind: "InlineComment", value: "comment string after" },
  ]);
  expect((args[3].value as BooleanValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment boolean before" },
    { kind: "InlineComment", value: "comment boolean after" },
  ]);
  expect((args[4].value as NullValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment null before" },
    { kind: "InlineComment", value: "comment null after" },
  ]);
  expect((args[5].value as EnumValueNode).comments).toEqual([
    { kind: "BlockComment", value: "comment enum before" },
    { kind: "InlineComment", value: "comment enum after" },
  ]);
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
  expect(description.comments).toEqual([
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
  Object.values(obj).forEach(stripComments);
}
