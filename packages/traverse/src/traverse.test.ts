import { NamedTypeNode, NameNode } from "@graphql-modular/language";
import { parse } from "@graphql-modular/parse";
import fs from "fs";
import path from "path";
import { expect, it } from "vitest";
import { traverse } from "./traverse";

const KITCHEN_SINK = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "kitchenSink.gql"),
  "utf8"
);

it("transforms a node without nested items", () => {
  const node: NameNode = { kind: "Name", value: "abcd", comments: [] };
  expect(
    traverse(node, {
      Name: {
        enter(node) {
          return { ...node, value: node.value.substring(1) };
        },
        leave(node) {
          return { ...node, value: node.value.repeat(2) };
        },
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "comments": [],
      "kind": "Name",
      "value": "bcdbcd",
    }
  `);
});

it("transforms a list of nodes without nested items", () => {
  const n: NameNode[] = [
    { kind: "Name", value: "abcd", comments: [] },
    { kind: "Name", value: "ABCD", comments: [] },
  ];
  expect(
    traverse(n, {
      Name: {
        enter(node) {
          return { ...node, value: node.value.substring(1) };
        },
        leave(node) {
          return { ...node, value: node.value.repeat(2) };
        },
      },
    })
  ).toMatchInlineSnapshot(`
    [
      {
        "comments": [],
        "kind": "Name",
        "value": "bcdbcd",
      },
      {
        "comments": [],
        "kind": "Name",
        "value": "BCDBCD",
      },
    ]
  `);
});

it("transforms a node with nested items", () => {
  const node: NamedTypeNode = {
    kind: "NamedType",
    name: { kind: "Name", value: "abcd", comments: [] },
  };
  expect(
    traverse(node, {
      Name: {
        enter(node) {
          return { ...node, value: node.value.substring(1) };
        },
        leave(node) {
          return { ...node, value: node.value.repeat(2) };
        },
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "kind": "NamedType",
      "name": {
        "comments": [],
        "kind": "Name",
        "value": "bcdbcd",
      },
    }
  `);
});

it("transforms a list of nodes with nested items", () => {
  const node: NamedTypeNode[] = [
    {
      kind: "NamedType",
      name: { kind: "Name", value: "abcd", comments: [] },
    },
    {
      kind: "NamedType",
      name: { kind: "Name", value: "ABCD", comments: [] },
    },
  ];
  expect(
    traverse(node, {
      Name: {
        enter(node) {
          return { ...node, value: node.value.substring(1) };
        },
        leave(node) {
          return { ...node, value: node.value.repeat(2) };
        },
      },
    })
  ).toMatchInlineSnapshot(`
    [
      {
        "kind": "NamedType",
        "name": {
          "comments": [],
          "kind": "Name",
          "value": "bcdbcd",
        },
      },
      {
        "kind": "NamedType",
        "name": {
          "comments": [],
          "kind": "Name",
          "value": "BCDBCD",
        },
      },
    ]
  `);
});

it("traverses with multiple layers of nesting", () => {
  const document = parse(KITCHEN_SINK);
  expect(
    traverse(document, {
      Name: {
        enter(node) {
          return { ...node, value: node.value.substring(1) };
        },
        leave(node) {
          return { ...node, value: node.value.repeat(2) };
        },
      },
    })
  ).toMatchInlineSnapshot(`
    {
      "definitions": [
        {
          "directives": [
            {
              "args": [],
              "kind": "Directive",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "nQuerynQuery",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "comments": [],
            "kind": "Name",
            "value": "ueryNameueryName",
          },
          "operation": "query",
          "selectionSet": [
            {
              "alias": {
                "comments": [],
                "kind": "Name",
                "value": "hoever123ishoever123is",
              },
              "args": [
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "dd",
                  },
                  "value": {
                    "kind": "ListValue",
                    "values": [
                      {
                        "kind": "IntValue",
                        "value": "123",
                      },
                      {
                        "kind": "IntValue",
                        "value": "456",
                      },
                    ],
                  },
                },
              ],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "odeode",
              },
              "selectionSet": [
                {
                  "alias": null,
                  "args": [],
                  "directives": [],
                  "kind": "Field",
                  "name": {
                    "comments": [
                      {
                        "kind": "BlockComment",
                        "value": "field block comment",
                      },
                    ],
                    "kind": "Name",
                    "value": "dd",
                  },
                  "selectionSet": [],
                },
                {
                  "directives": [
                    {
                      "args": [],
                      "kind": "Directive",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "nInlineFragmentnInlineFragment",
                      },
                    },
                  ],
                  "kind": "InlineFragment",
                  "selectionSet": [
                    {
                      "alias": null,
                      "args": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "ield2ield2",
                      },
                      "selectionSet": [
                        {
                          "alias": null,
                          "args": [],
                          "directives": [],
                          "kind": "Field",
                          "name": {
                            "comments": [
                              {
                                "kind": "InlineComment",
                                "value": "field inline comment",
                              },
                            ],
                            "kind": "Name",
                            "value": "dd",
                          },
                          "selectionSet": [],
                        },
                        {
                          "alias": {
                            "comments": [],
                            "kind": "Name",
                            "value": "liaslias",
                          },
                          "args": [
                            {
                              "kind": "Argument",
                              "name": {
                                "comments": [],
                                "kind": "Name",
                                "value": "irstirst",
                              },
                              "value": {
                                "kind": "IntValue",
                                "value": "10",
                              },
                            },
                            {
                              "kind": "Argument",
                              "name": {
                                "comments": [],
                                "kind": "Name",
                                "value": "fterfter",
                              },
                              "value": {
                                "comments": [],
                                "kind": "Variable",
                                "name": {
                                  "comments": [],
                                  "kind": "Name",
                                  "value": "oooo",
                                },
                              },
                            },
                          ],
                          "directives": [
                            {
                              "args": [
                                {
                                  "kind": "Argument",
                                  "name": {
                                    "comments": [],
                                    "kind": "Name",
                                    "value": "ff",
                                  },
                                  "value": {
                                    "comments": [],
                                    "kind": "Variable",
                                    "name": {
                                      "comments": [],
                                      "kind": "Name",
                                      "value": "oooo",
                                    },
                                  },
                                },
                              ],
                              "kind": "Directive",
                              "name": {
                                "comments": [],
                                "kind": "Name",
                                "value": "ncludenclude",
                              },
                            },
                          ],
                          "kind": "Field",
                          "name": {
                            "comments": [],
                            "kind": "Name",
                            "value": "ield1ield1",
                          },
                          "selectionSet": [
                            {
                              "alias": null,
                              "args": [],
                              "directives": [],
                              "kind": "Field",
                              "name": {
                                "comments": [],
                                "kind": "Name",
                                "value": "dd",
                              },
                              "selectionSet": [],
                            },
                            {
                              "directives": [
                                {
                                  "args": [],
                                  "kind": "Directive",
                                  "name": {
                                    "comments": [],
                                    "kind": "Name",
                                    "value": "nFragmentSpreadnFragmentSpread",
                                  },
                                },
                              ],
                              "kind": "FragmentSpread",
                              "name": {
                                "comments": [],
                                "kind": "Name",
                                "value": "ragrag",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  "typeCondition": {
                    "kind": "NamedType",
                    "name": {
                      "comments": [],
                      "kind": "Name",
                      "value": "serser",
                    },
                  },
                },
                {
                  "directives": [
                    {
                      "args": [
                        {
                          "kind": "Argument",
                          "name": {
                            "comments": [],
                            "kind": "Name",
                            "value": "nlessnless",
                          },
                          "value": {
                            "comments": [],
                            "kind": "Variable",
                            "name": {
                              "comments": [],
                              "kind": "Name",
                              "value": "oooo",
                            },
                          },
                        },
                      ],
                      "kind": "Directive",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "kipkip",
                      },
                    },
                  ],
                  "kind": "InlineFragment",
                  "selectionSet": [
                    {
                      "alias": null,
                      "args": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "dd",
                      },
                      "selectionSet": [],
                    },
                  ],
                  "typeCondition": null,
                },
                {
                  "directives": [],
                  "kind": "InlineFragment",
                  "selectionSet": [
                    {
                      "alias": null,
                      "args": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "dd",
                      },
                      "selectionSet": [],
                    },
                  ],
                  "typeCondition": null,
                },
              ],
            },
          ],
          "variableDefinitions": [
            {
              "defaultValue": null,
              "directives": [],
              "kind": "VariableDefinition",
              "type": {
                "kind": "NamedType",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "omplexTypeomplexType",
                },
              },
              "variable": {
                "comments": [],
                "kind": "Variable",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "oooo",
                },
              },
            },
            {
              "defaultValue": {
                "kind": "EnumValue",
                "value": "MOBILE",
              },
              "directives": [],
              "kind": "VariableDefinition",
              "type": {
                "kind": "NamedType",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "iteite",
                },
              },
              "variable": {
                "comments": [],
                "kind": "Variable",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "iteite",
                },
              },
            },
          ],
        },
        {
          "directives": [
            {
              "args": [],
              "kind": "Directive",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "nMutationnMutation",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "comments": [],
            "kind": "Name",
            "value": "ikeStoryikeStory",
          },
          "operation": "mutation",
          "selectionSet": [
            {
              "alias": null,
              "args": [
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "torytory",
                  },
                  "value": {
                    "kind": "IntValue",
                    "value": "123",
                  },
                },
              ],
              "directives": [
                {
                  "args": [],
                  "kind": "Directive",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "nFieldnField",
                  },
                },
              ],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "ikeike",
              },
              "selectionSet": [
                {
                  "alias": null,
                  "args": [],
                  "directives": [],
                  "kind": "Field",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "torytory",
                  },
                  "selectionSet": [
                    {
                      "alias": null,
                      "args": [],
                      "directives": [
                        {
                          "args": [],
                          "kind": "Directive",
                          "name": {
                            "comments": [],
                            "kind": "Name",
                            "value": "nFieldnField",
                          },
                        },
                      ],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "dd",
                      },
                      "selectionSet": [],
                    },
                  ],
                },
              ],
            },
          ],
          "variableDefinitions": [],
        },
        {
          "directives": [
            {
              "args": [],
              "kind": "Directive",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "nSubscriptionnSubscription",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "comments": [],
            "kind": "Name",
            "value": "toryLikeSubscriptiontoryLikeSubscription",
          },
          "operation": "subscription",
          "selectionSet": [
            {
              "alias": null,
              "args": [
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "nputnput",
                  },
                  "value": {
                    "comments": [],
                    "kind": "Variable",
                    "name": {
                      "comments": [],
                      "kind": "Name",
                      "value": "nputnput",
                    },
                  },
                },
              ],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "toryLikeSubscribetoryLikeSubscribe",
              },
              "selectionSet": [
                {
                  "alias": null,
                  "args": [],
                  "directives": [],
                  "kind": "Field",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "torytory",
                  },
                  "selectionSet": [
                    {
                      "alias": null,
                      "args": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "ikersikers",
                      },
                      "selectionSet": [
                        {
                          "alias": null,
                          "args": [],
                          "directives": [],
                          "kind": "Field",
                          "name": {
                            "comments": [],
                            "kind": "Name",
                            "value": "ountount",
                          },
                          "selectionSet": [],
                        },
                      ],
                    },
                    {
                      "alias": null,
                      "args": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "comments": [],
                        "kind": "Name",
                        "value": "ikeSentenceikeSentence",
                      },
                      "selectionSet": [
                        {
                          "alias": null,
                          "args": [],
                          "directives": [],
                          "kind": "Field",
                          "name": {
                            "comments": [],
                            "kind": "Name",
                            "value": "extext",
                          },
                          "selectionSet": [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          "variableDefinitions": [
            {
              "defaultValue": null,
              "directives": [
                {
                  "args": [],
                  "kind": "Directive",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "nVariableDefinitionnVariableDefinition",
                  },
                },
              ],
              "kind": "VariableDefinition",
              "type": {
                "kind": "NamedType",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "toryLikeSubscribeInputtoryLikeSubscribeInput",
                },
              },
              "variable": {
                "comments": [],
                "kind": "Variable",
                "name": {
                  "comments": [],
                  "kind": "Name",
                  "value": "nputnput",
                },
              },
            },
          ],
        },
        {
          "directives": [
            {
              "args": [],
              "kind": "Directive",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "nFragmentDefinitionnFragmentDefinition",
              },
            },
          ],
          "kind": "FragmentDefinition",
          "name": {
            "comments": [],
            "kind": "Name",
            "value": "ragrag",
          },
          "selectionSet": [
            {
              "alias": null,
              "args": [
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "izeize",
                  },
                  "value": {
                    "comments": [],
                    "kind": "Variable",
                    "name": {
                      "comments": [],
                      "kind": "Name",
                      "value": "izeize",
                    },
                  },
                },
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "arar",
                  },
                  "value": {
                    "comments": [],
                    "kind": "Variable",
                    "name": {
                      "comments": [],
                      "kind": "Name",
                      "value": "",
                    },
                  },
                },
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "bjbj",
                  },
                  "value": {
                    "fields": [
                      {
                        "kind": "ObjectField",
                        "name": {
                          "comments": [],
                          "kind": "Name",
                          "value": "eyey",
                        },
                        "value": {
                          "block": false,
                          "kind": "StringValue",
                          "value": "value",
                        },
                      },
                      {
                        "kind": "ObjectField",
                        "name": {
                          "comments": [],
                          "kind": "Name",
                          "value": "locklock",
                        },
                        "value": {
                          "block": true,
                          "kind": "StringValue",
                          "value": "block string uses \\"\\"\\"",
                        },
                      },
                    ],
                    "kind": "ObjectValue",
                  },
                },
              ],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "oooo",
              },
              "selectionSet": [],
            },
          ],
          "typeCondition": {
            "kind": "NamedType",
            "name": {
              "comments": [],
              "kind": "Name",
              "value": "riendriend",
            },
          },
        },
        {
          "directives": [],
          "kind": "OperationDefinition",
          "name": null,
          "operation": "query",
          "selectionSet": [
            {
              "alias": null,
              "args": [
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "ruthyruthy",
                  },
                  "value": {
                    "kind": "BooleanValue",
                    "value": true,
                  },
                },
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "alsyalsy",
                  },
                  "value": {
                    "kind": "BooleanValue",
                    "value": false,
                  },
                },
                {
                  "kind": "Argument",
                  "name": {
                    "comments": [],
                    "kind": "Name",
                    "value": "ullishullish",
                  },
                  "value": {
                    "kind": "NullValue",
                  },
                },
              ],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "nnamednnamed",
              },
              "selectionSet": [],
            },
            {
              "alias": null,
              "args": [],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "ueryuery",
              },
              "selectionSet": [],
            },
          ],
          "variableDefinitions": [],
        },
        {
          "directives": [],
          "kind": "OperationDefinition",
          "name": null,
          "operation": "query",
          "selectionSet": [
            {
              "alias": null,
              "args": [],
              "directives": [],
              "kind": "Field",
              "name": {
                "comments": [],
                "kind": "Name",
                "value": "_typename_typename",
              },
              "selectionSet": [],
            },
          ],
          "variableDefinitions": [],
        },
      ],
      "kind": "Document",
    }
  `);
});

it("leaves and enters in the right order", () => {
  const debug: string[][] = [];
  traverse(parse(KITCHEN_SINK), {
    Argument: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    BooleanValue: {
      enter(node) {
        debug.push(["enter", node.kind, "" + node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, "" + node.value]);
      },
    },
    Directive: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    DirectiveDefinition: {
      enter(node) {
        debug.push([
          "enter",
          node.kind,
          "" + node.repeatable,
          "" + node.locations,
        ]);
      },
      leave(node) {
        debug.push([
          "leave",
          node.kind,
          "" + node.repeatable,
          "" + node.locations,
        ]);
      },
    },
    Document: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    EnumTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    EnumTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    EnumValue: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
      },
    },
    EnumValueDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    Field: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    FieldDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    FloatValue: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
      },
    },
    FragmentDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    FragmentSpread: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    InlineFragment: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    InputObjectTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    InputObjectTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    InputValueDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    IntValue: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
      },
    },
    InterfaceTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    InterfaceTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ListType: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ListValue: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    Name: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
      },
    },
    NamedType: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    NonNullType: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    NullValue: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ObjectField: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ObjectTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ObjectTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ObjectValue: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    OperationDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    OperationTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ScalarTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ScalarTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    SchemaDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    SchemaExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    StringValue: {
      enter(node) {
        debug.push(["enter", node.kind, node.value, "" + node.block]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value, "" + node.block]);
      },
    },
    UnionTypeDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    UnionTypeExtension: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    Variable: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    VariableDefinition: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
  });
  expect(debug).toMatchInlineSnapshot(`
    [
      [
        "enter",
        "Document",
      ],
      [
        "enter",
        "OperationDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "InlineFragment",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "FragmentSpread",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onFragmentSpread",
      ],
      [
        "leave",
        "Name",
        "onFragmentSpread",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "frag",
      ],
      [
        "leave",
        "Name",
        "frag",
      ],
      [
        "leave",
        "FragmentSpread",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "if",
      ],
      [
        "leave",
        "Name",
        "if",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "include",
      ],
      [
        "leave",
        "Name",
        "include",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "IntValue",
        "10",
      ],
      [
        "leave",
        "IntValue",
        "10",
      ],
      [
        "enter",
        "Name",
        "first",
      ],
      [
        "leave",
        "Name",
        "first",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "after",
      ],
      [
        "leave",
        "Name",
        "after",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "field1",
      ],
      [
        "leave",
        "Name",
        "field1",
      ],
      [
        "enter",
        "Name",
        "alias",
      ],
      [
        "leave",
        "Name",
        "alias",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Name",
        "field2",
      ],
      [
        "leave",
        "Name",
        "field2",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onInlineFragment",
      ],
      [
        "leave",
        "Name",
        "onInlineFragment",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "User",
      ],
      [
        "leave",
        "Name",
        "User",
      ],
      [
        "leave",
        "NamedType",
      ],
      [
        "leave",
        "InlineFragment",
      ],
      [
        "enter",
        "InlineFragment",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "unless",
      ],
      [
        "leave",
        "Name",
        "unless",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "skip",
      ],
      [
        "leave",
        "Name",
        "skip",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "leave",
        "InlineFragment",
      ],
      [
        "enter",
        "InlineFragment",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "leave",
        "InlineFragment",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "ListValue",
      ],
      [
        "enter",
        "IntValue",
        "123",
      ],
      [
        "leave",
        "IntValue",
        "123",
      ],
      [
        "enter",
        "IntValue",
        "456",
      ],
      [
        "leave",
        "IntValue",
        "456",
      ],
      [
        "leave",
        "ListValue",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "node",
      ],
      [
        "leave",
        "Name",
        "node",
      ],
      [
        "enter",
        "Name",
        "whoever123is",
      ],
      [
        "leave",
        "Name",
        "whoever123is",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onQuery",
      ],
      [
        "leave",
        "Name",
        "onQuery",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "VariableDefinition",
      ],
      [
        "enter",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "ComplexType",
      ],
      [
        "leave",
        "Name",
        "ComplexType",
      ],
      [
        "leave",
        "NamedType",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "leave",
        "VariableDefinition",
      ],
      [
        "enter",
        "VariableDefinition",
      ],
      [
        "enter",
        "EnumValue",
        "MOBILE",
      ],
      [
        "leave",
        "EnumValue",
        "MOBILE",
      ],
      [
        "enter",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "Site",
      ],
      [
        "leave",
        "Name",
        "Site",
      ],
      [
        "leave",
        "NamedType",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "site",
      ],
      [
        "leave",
        "Name",
        "site",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "leave",
        "VariableDefinition",
      ],
      [
        "enter",
        "Name",
        "queryName",
      ],
      [
        "leave",
        "Name",
        "queryName",
      ],
      [
        "leave",
        "OperationDefinition",
      ],
      [
        "enter",
        "OperationDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onField",
      ],
      [
        "leave",
        "Name",
        "onField",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "id",
      ],
      [
        "leave",
        "Name",
        "id",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Name",
        "story",
      ],
      [
        "leave",
        "Name",
        "story",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onField",
      ],
      [
        "leave",
        "Name",
        "onField",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "IntValue",
        "123",
      ],
      [
        "leave",
        "IntValue",
        "123",
      ],
      [
        "enter",
        "Name",
        "story",
      ],
      [
        "leave",
        "Name",
        "story",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "like",
      ],
      [
        "leave",
        "Name",
        "like",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onMutation",
      ],
      [
        "leave",
        "Name",
        "onMutation",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "likeStory",
      ],
      [
        "leave",
        "Name",
        "likeStory",
      ],
      [
        "leave",
        "OperationDefinition",
      ],
      [
        "enter",
        "OperationDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "count",
      ],
      [
        "leave",
        "Name",
        "count",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Name",
        "likers",
      ],
      [
        "leave",
        "Name",
        "likers",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "text",
      ],
      [
        "leave",
        "Name",
        "text",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Name",
        "likeSentence",
      ],
      [
        "leave",
        "Name",
        "likeSentence",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Name",
        "story",
      ],
      [
        "leave",
        "Name",
        "story",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "input",
      ],
      [
        "leave",
        "Name",
        "input",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "input",
      ],
      [
        "leave",
        "Name",
        "input",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "storyLikeSubscribe",
      ],
      [
        "leave",
        "Name",
        "storyLikeSubscribe",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onSubscription",
      ],
      [
        "leave",
        "Name",
        "onSubscription",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "VariableDefinition",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onVariableDefinition",
      ],
      [
        "leave",
        "Name",
        "onVariableDefinition",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "StoryLikeSubscribeInput",
      ],
      [
        "leave",
        "Name",
        "StoryLikeSubscribeInput",
      ],
      [
        "leave",
        "NamedType",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "input",
      ],
      [
        "leave",
        "Name",
        "input",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "leave",
        "VariableDefinition",
      ],
      [
        "enter",
        "Name",
        "StoryLikeSubscription",
      ],
      [
        "leave",
        "Name",
        "StoryLikeSubscription",
      ],
      [
        "leave",
        "OperationDefinition",
      ],
      [
        "enter",
        "FragmentDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "size",
      ],
      [
        "leave",
        "Name",
        "size",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "size",
      ],
      [
        "leave",
        "Name",
        "size",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "b",
      ],
      [
        "leave",
        "Name",
        "b",
      ],
      [
        "leave",
        "Variable",
      ],
      [
        "enter",
        "Name",
        "bar",
      ],
      [
        "leave",
        "Name",
        "bar",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "ObjectValue",
      ],
      [
        "enter",
        "ObjectField",
      ],
      [
        "enter",
        "StringValue",
        "value",
        "false",
      ],
      [
        "leave",
        "StringValue",
        "value",
        "false",
      ],
      [
        "enter",
        "Name",
        "key",
      ],
      [
        "leave",
        "Name",
        "key",
      ],
      [
        "leave",
        "ObjectField",
      ],
      [
        "enter",
        "ObjectField",
      ],
      [
        "enter",
        "StringValue",
        "block string uses \\"\\"\\"",
        "true",
      ],
      [
        "leave",
        "StringValue",
        "block string uses \\"\\"\\"",
        "true",
      ],
      [
        "enter",
        "Name",
        "block",
      ],
      [
        "leave",
        "Name",
        "block",
      ],
      [
        "leave",
        "ObjectField",
      ],
      [
        "leave",
        "ObjectValue",
      ],
      [
        "enter",
        "Name",
        "obj",
      ],
      [
        "leave",
        "Name",
        "obj",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Name",
        "foo",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "Name",
        "onFragmentDefinition",
      ],
      [
        "leave",
        "Name",
        "onFragmentDefinition",
      ],
      [
        "leave",
        "Directive",
      ],
      [
        "enter",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "Friend",
      ],
      [
        "leave",
        "Name",
        "Friend",
      ],
      [
        "leave",
        "NamedType",
      ],
      [
        "enter",
        "Name",
        "frag",
      ],
      [
        "leave",
        "Name",
        "frag",
      ],
      [
        "leave",
        "FragmentDefinition",
      ],
      [
        "enter",
        "OperationDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "BooleanValue",
        "true",
      ],
      [
        "leave",
        "BooleanValue",
        "true",
      ],
      [
        "enter",
        "Name",
        "truthy",
      ],
      [
        "leave",
        "Name",
        "truthy",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "BooleanValue",
        "false",
      ],
      [
        "leave",
        "BooleanValue",
        "false",
      ],
      [
        "enter",
        "Name",
        "falsy",
      ],
      [
        "leave",
        "Name",
        "falsy",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Argument",
      ],
      [
        "enter",
        "NullValue",
      ],
      [
        "leave",
        "NullValue",
      ],
      [
        "enter",
        "Name",
        "nullish",
      ],
      [
        "leave",
        "Name",
        "nullish",
      ],
      [
        "leave",
        "Argument",
      ],
      [
        "enter",
        "Name",
        "unnamed",
      ],
      [
        "leave",
        "Name",
        "unnamed",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "query",
      ],
      [
        "leave",
        "Name",
        "query",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "leave",
        "OperationDefinition",
      ],
      [
        "enter",
        "OperationDefinition",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "Name",
        "__typename",
      ],
      [
        "leave",
        "Name",
        "__typename",
      ],
      [
        "leave",
        "Field",
      ],
      [
        "leave",
        "OperationDefinition",
      ],
      [
        "leave",
        "Document",
      ],
    ]
  `);
});
