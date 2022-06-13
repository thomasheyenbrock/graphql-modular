import fs from "fs";
import { DocumentNode, parse as _parseGql, visit } from "graphql";
import path from "path";
import { expect, it } from "vitest";
import { parse } from "./parser";

const KITCHEN_SINK = fs.readFileSync(
  path.join(__dirname, "example.gql"),
  "utf8"
);

it("kitchen sink", () => {
  expect(parse(KITCHEN_SINK)).toEqual(parseGql(KITCHEN_SINK));
});

it.skip("timing", () => {
  let start = Date.now();
  for (let i = 0; i < 10; i++) parse(KITCHEN_SINK);
  const time = Date.now() - start;

  start = Date.now();
  for (let i = 0; i < 10; i++) _parseGql(KITCHEN_SINK, { noLocation: true });
  const compare = Date.now() - start;

  expect(time).toBeLessThan(compare);
});

function parseGql(source: string): DocumentNode {
  const ast = _parseGql(source, { noLocation: true });
  return visit(ast, {
    Directive: {
      leave({ arguments: args, ...restNode }) {
        // we always use "args" as key instead of "arguments"
        return { args, ...restNode };
      },
    },
    DirectiveDefinition: {
      leave({ arguments: args, description, locations, ...restNode }) {
        return {
          ...restNode,
          // we always use "args" as key instead of "arguments"
          args,
          // null instead of undefined
          description: description ?? null,
          // we use a string union type instead of generic names
          locations: locations.map((location) => location.value),
        };
      },
    },
    EnumTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    EnumValueDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
          // name uses kind EnumValue
          name: { ...node.name, kind: "EnumValue" },
        };
      },
    },
    Field: {
      leave({ alias, arguments: args, selectionSet, ...restNode }) {
        return {
          ...restNode,
          // null instead of undefined
          alias: alias ?? null,
          // we always use "args" as key instead of "arguments"
          args,
          // Empty selection set is empty array
          selectionSet: selectionSet ?? [],
        };
      },
    },
    FieldDefinition: {
      leave({ arguments: args, description, ...restNode }) {
        return {
          ...restNode,
          // null instead of undefined
          description: description ?? null,
          // we always use "args" as key instead of "arguments"
          args,
        };
      },
    },
    InlineFragment: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          typeCondition: node.typeCondition ?? null,
        };
      },
    },
    InputObjectTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    InputValueDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          defaultValue: node.defaultValue ?? null,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    InterfaceTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    ObjectTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    OperationDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          name: node.name ?? null,
        };
      },
    },
    ScalarTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    SchemaDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    // No selection set but just a list of selections
    SelectionSet: {
      leave(node) {
        return node.selections;
      },
    },
    UnionTypeDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          description: node.description ?? null,
        };
      },
    },
    VariableDefinition: {
      leave(node) {
        return {
          ...node,
          // null instead of undefined
          defaultValue: node.defaultValue ?? null,
        };
      },
    },
  });
}
