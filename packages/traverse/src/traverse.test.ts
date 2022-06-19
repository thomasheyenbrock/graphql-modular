import type { NamedTypeNode, NameNode } from "@graphql-modular/language";
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
  const node: NameNode = { kind: "Name", value: "abcd" };
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
      "kind": "Name",
      "value": "bcdbcd",
    }
  `);
});

it("transforms a list of nodes without nested items", () => {
  const n: NameNode[] = [
    { kind: "Name", value: "abcd" },
    { kind: "Name", value: "ABCD" },
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
        "kind": "Name",
        "value": "bcdbcd",
      },
      {
        "kind": "Name",
        "value": "BCDBCD",
      },
    ]
  `);
});

it("transforms a node with nested items", () => {
  const node: NamedTypeNode = {
    kind: "NamedType",
    name: { kind: "Name", value: "abcd" },
    comments: [],
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
      "comments": [],
      "kind": "NamedType",
      "name": {
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
      name: { kind: "Name", value: "abcd" },
      comments: [],
    },
    {
      kind: "NamedType",
      name: { kind: "Name", value: "ABCD" },
      comments: [],
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
        "comments": [],
        "kind": "NamedType",
        "name": {
          "kind": "Name",
          "value": "bcdbcd",
        },
      },
      {
        "comments": [],
        "kind": "NamedType",
        "name": {
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
      "comments": [],
      "definitions": [
        {
          "comments": [],
          "directives": [
            {
              "argumentSet": null,
              "comments": [],
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "nQuerynQuery",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "kind": "Name",
            "value": "ueryNameueryName",
          },
          "operation": "query",
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": {
                  "kind": "Name",
                  "value": "hoever123ishoever123is",
                },
                "argumentSet": {
                  "args": [
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "dd",
                      },
                      "value": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "ListValue",
                        "values": [
                          {
                            "comments": [],
                            "kind": "IntValue",
                            "value": "123",
                          },
                          {
                            "comments": [],
                            "kind": "IntValue",
                            "value": "456",
                          },
                        ],
                      },
                    },
                  ],
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "ArgumentSet",
                },
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "odeode",
                },
                "selectionSet": {
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "SelectionSet",
                  "selections": [
                    {
                      "alias": null,
                      "argumentSet": null,
                      "comments": [
                        {
                          "kind": "BlockComment",
                          "value": "field block comment",
                        },
                      ],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "kind": "Name",
                        "value": "dd",
                      },
                      "selectionSet": null,
                    },
                    {
                      "comments": [],
                      "directives": [
                        {
                          "argumentSet": null,
                          "comments": [],
                          "kind": "Directive",
                          "name": {
                            "kind": "Name",
                            "value": "nInlineFragmentnInlineFragment",
                          },
                        },
                      ],
                      "kind": "InlineFragment",
                      "selectionSet": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "SelectionSet",
                        "selections": [
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "ield2ield2",
                            },
                            "selectionSet": {
                              "commentsClosingBracket": [],
                              "commentsOpeningBracket": [],
                              "kind": "SelectionSet",
                              "selections": [
                                {
                                  "alias": null,
                                  "argumentSet": null,
                                  "comments": [
                                    {
                                      "kind": "InlineComment",
                                      "value": "field inline comment",
                                    },
                                  ],
                                  "directives": [],
                                  "kind": "Field",
                                  "name": {
                                    "kind": "Name",
                                    "value": "dd",
                                  },
                                  "selectionSet": null,
                                },
                                {
                                  "alias": {
                                    "kind": "Name",
                                    "value": "liaslias",
                                  },
                                  "argumentSet": {
                                    "args": [
                                      {
                                        "comments": [],
                                        "kind": "Argument",
                                        "name": {
                                          "kind": "Name",
                                          "value": "irstirst",
                                        },
                                        "value": {
                                          "comments": [],
                                          "kind": "IntValue",
                                          "value": "10",
                                        },
                                      },
                                      {
                                        "comments": [],
                                        "kind": "Argument",
                                        "name": {
                                          "kind": "Name",
                                          "value": "fterfter",
                                        },
                                        "value": {
                                          "comments": [],
                                          "kind": "Variable",
                                          "name": {
                                            "kind": "Name",
                                            "value": "oooo",
                                          },
                                        },
                                      },
                                    ],
                                    "commentsClosingBracket": [],
                                    "commentsOpeningBracket": [],
                                    "kind": "ArgumentSet",
                                  },
                                  "comments": [],
                                  "directives": [
                                    {
                                      "argumentSet": {
                                        "args": [
                                          {
                                            "comments": [],
                                            "kind": "Argument",
                                            "name": {
                                              "kind": "Name",
                                              "value": "ff",
                                            },
                                            "value": {
                                              "comments": [],
                                              "kind": "Variable",
                                              "name": {
                                                "kind": "Name",
                                                "value": "oooo",
                                              },
                                            },
                                          },
                                        ],
                                        "commentsClosingBracket": [],
                                        "commentsOpeningBracket": [],
                                        "kind": "ArgumentSet",
                                      },
                                      "comments": [],
                                      "kind": "Directive",
                                      "name": {
                                        "kind": "Name",
                                        "value": "ncludenclude",
                                      },
                                    },
                                  ],
                                  "kind": "Field",
                                  "name": {
                                    "kind": "Name",
                                    "value": "ield1ield1",
                                  },
                                  "selectionSet": {
                                    "commentsClosingBracket": [],
                                    "commentsOpeningBracket": [],
                                    "kind": "SelectionSet",
                                    "selections": [
                                      {
                                        "alias": null,
                                        "argumentSet": null,
                                        "comments": [],
                                        "directives": [],
                                        "kind": "Field",
                                        "name": {
                                          "kind": "Name",
                                          "value": "dd",
                                        },
                                        "selectionSet": null,
                                      },
                                      {
                                        "comments": [],
                                        "directives": [
                                          {
                                            "argumentSet": null,
                                            "comments": [],
                                            "kind": "Directive",
                                            "name": {
                                              "kind": "Name",
                                              "value": "nFragmentSpreadnFragmentSpread",
                                            },
                                          },
                                        ],
                                        "kind": "FragmentSpread",
                                        "name": {
                                          "kind": "Name",
                                          "value": "ragrag",
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                      "typeCondition": {
                        "comments": [],
                        "kind": "NamedType",
                        "name": {
                          "kind": "Name",
                          "value": "serser",
                        },
                      },
                    },
                    {
                      "comments": [],
                      "directives": [
                        {
                          "argumentSet": {
                            "args": [
                              {
                                "comments": [],
                                "kind": "Argument",
                                "name": {
                                  "kind": "Name",
                                  "value": "nlessnless",
                                },
                                "value": {
                                  "comments": [],
                                  "kind": "Variable",
                                  "name": {
                                    "kind": "Name",
                                    "value": "oooo",
                                  },
                                },
                              },
                            ],
                            "commentsClosingBracket": [],
                            "commentsOpeningBracket": [],
                            "kind": "ArgumentSet",
                          },
                          "comments": [],
                          "kind": "Directive",
                          "name": {
                            "kind": "Name",
                            "value": "kipkip",
                          },
                        },
                      ],
                      "kind": "InlineFragment",
                      "selectionSet": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "SelectionSet",
                        "selections": [
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "dd",
                            },
                            "selectionSet": null,
                          },
                        ],
                      },
                      "typeCondition": null,
                    },
                    {
                      "comments": [],
                      "directives": [],
                      "kind": "InlineFragment",
                      "selectionSet": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "SelectionSet",
                        "selections": [
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "dd",
                            },
                            "selectionSet": null,
                          },
                        ],
                      },
                      "typeCondition": null,
                    },
                  ],
                },
              },
            ],
          },
          "variableDefinitionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "definitions": [
              {
                "comments": [],
                "defaultValue": null,
                "directives": [],
                "kind": "VariableDefinition",
                "type": {
                  "comments": [],
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "omplexTypeomplexType",
                  },
                },
                "variable": {
                  "comments": [],
                  "kind": "Variable",
                  "name": {
                    "kind": "Name",
                    "value": "oooo",
                  },
                },
              },
              {
                "comments": [],
                "defaultValue": {
                  "comments": [],
                  "kind": "EnumValue",
                  "value": "MOBILE",
                },
                "directives": [],
                "kind": "VariableDefinition",
                "type": {
                  "comments": [],
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "iteite",
                  },
                },
                "variable": {
                  "comments": [],
                  "kind": "Variable",
                  "name": {
                    "kind": "Name",
                    "value": "iteite",
                  },
                },
              },
            ],
            "kind": "VariableDefinitionSet",
          },
        },
        {
          "comments": [
            {
              "kind": "BlockComment",
              "value": "block comment
    with multiple lines",
            },
            {
              "kind": "BlockComment",
              "value": "this is a new comment",
            },
          ],
          "directives": [
            {
              "argumentSet": null,
              "comments": [],
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "nMutationnMutation",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "kind": "Name",
            "value": "ikeStoryikeStory",
          },
          "operation": "mutation",
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": null,
                "argumentSet": {
                  "args": [
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "torytory",
                      },
                      "value": {
                        "comments": [],
                        "kind": "IntValue",
                        "value": "123",
                      },
                    },
                  ],
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "ArgumentSet",
                },
                "comments": [],
                "directives": [
                  {
                    "argumentSet": null,
                    "comments": [],
                    "kind": "Directive",
                    "name": {
                      "kind": "Name",
                      "value": "nFieldnField",
                    },
                  },
                ],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "ikeike",
                },
                "selectionSet": {
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "SelectionSet",
                  "selections": [
                    {
                      "alias": null,
                      "argumentSet": null,
                      "comments": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "kind": "Name",
                        "value": "torytory",
                      },
                      "selectionSet": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "SelectionSet",
                        "selections": [
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [
                              {
                                "argumentSet": null,
                                "comments": [],
                                "kind": "Directive",
                                "name": {
                                  "kind": "Name",
                                  "value": "nFieldnField",
                                },
                              },
                            ],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "dd",
                            },
                            "selectionSet": null,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
          "variableDefinitionSet": null,
        },
        {
          "comments": [],
          "directives": [
            {
              "argumentSet": null,
              "comments": [],
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "nSubscriptionnSubscription",
              },
            },
          ],
          "kind": "OperationDefinition",
          "name": {
            "kind": "Name",
            "value": "toryLikeSubscriptiontoryLikeSubscription",
          },
          "operation": "subscription",
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": null,
                "argumentSet": {
                  "args": [
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "nputnput",
                      },
                      "value": {
                        "comments": [],
                        "kind": "Variable",
                        "name": {
                          "kind": "Name",
                          "value": "nputnput",
                        },
                      },
                    },
                  ],
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "ArgumentSet",
                },
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "toryLikeSubscribetoryLikeSubscribe",
                },
                "selectionSet": {
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "SelectionSet",
                  "selections": [
                    {
                      "alias": null,
                      "argumentSet": null,
                      "comments": [],
                      "directives": [],
                      "kind": "Field",
                      "name": {
                        "kind": "Name",
                        "value": "torytory",
                      },
                      "selectionSet": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "kind": "SelectionSet",
                        "selections": [
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "ikersikers",
                            },
                            "selectionSet": {
                              "commentsClosingBracket": [],
                              "commentsOpeningBracket": [],
                              "kind": "SelectionSet",
                              "selections": [
                                {
                                  "alias": null,
                                  "argumentSet": null,
                                  "comments": [],
                                  "directives": [],
                                  "kind": "Field",
                                  "name": {
                                    "kind": "Name",
                                    "value": "ountount",
                                  },
                                  "selectionSet": null,
                                },
                              ],
                            },
                          },
                          {
                            "alias": null,
                            "argumentSet": null,
                            "comments": [],
                            "directives": [],
                            "kind": "Field",
                            "name": {
                              "kind": "Name",
                              "value": "ikeSentenceikeSentence",
                            },
                            "selectionSet": {
                              "commentsClosingBracket": [],
                              "commentsOpeningBracket": [],
                              "kind": "SelectionSet",
                              "selections": [
                                {
                                  "alias": null,
                                  "argumentSet": null,
                                  "comments": [],
                                  "directives": [],
                                  "kind": "Field",
                                  "name": {
                                    "kind": "Name",
                                    "value": "extext",
                                  },
                                  "selectionSet": null,
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
          "variableDefinitionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "definitions": [
              {
                "comments": [],
                "defaultValue": null,
                "directives": [
                  {
                    "argumentSet": null,
                    "comments": [],
                    "kind": "Directive",
                    "name": {
                      "kind": "Name",
                      "value": "nVariableDefinitionnVariableDefinition",
                    },
                  },
                ],
                "kind": "VariableDefinition",
                "type": {
                  "comments": [],
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "toryLikeSubscribeInputtoryLikeSubscribeInput",
                  },
                },
                "variable": {
                  "comments": [],
                  "kind": "Variable",
                  "name": {
                    "kind": "Name",
                    "value": "nputnput",
                  },
                },
              },
            ],
            "kind": "VariableDefinitionSet",
          },
        },
        {
          "comments": [],
          "directives": [
            {
              "argumentSet": null,
              "comments": [],
              "kind": "Directive",
              "name": {
                "kind": "Name",
                "value": "nFragmentDefinitionnFragmentDefinition",
              },
            },
          ],
          "kind": "FragmentDefinition",
          "name": {
            "kind": "Name",
            "value": "ragrag",
          },
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": null,
                "argumentSet": {
                  "args": [
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "izeize",
                      },
                      "value": {
                        "comments": [],
                        "kind": "Variable",
                        "name": {
                          "kind": "Name",
                          "value": "izeize",
                        },
                      },
                    },
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "arar",
                      },
                      "value": {
                        "comments": [],
                        "kind": "Variable",
                        "name": {
                          "kind": "Name",
                          "value": "",
                        },
                      },
                    },
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "bjbj",
                      },
                      "value": {
                        "commentsClosingBracket": [],
                        "commentsOpeningBracket": [],
                        "fields": [
                          {
                            "comments": [],
                            "kind": "ObjectField",
                            "name": {
                              "kind": "Name",
                              "value": "eyey",
                            },
                            "value": {
                              "block": false,
                              "comments": [],
                              "kind": "StringValue",
                              "value": "value",
                            },
                          },
                          {
                            "comments": [],
                            "kind": "ObjectField",
                            "name": {
                              "kind": "Name",
                              "value": "locklock",
                            },
                            "value": {
                              "block": true,
                              "comments": [],
                              "kind": "StringValue",
                              "value": "block string uses \\"\\"\\"",
                            },
                          },
                        ],
                        "kind": "ObjectValue",
                      },
                    },
                  ],
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "ArgumentSet",
                },
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "oooo",
                },
                "selectionSet": null,
              },
            ],
          },
          "typeCondition": {
            "comments": [],
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "riendriend",
            },
          },
        },
        {
          "comments": [],
          "directives": [],
          "kind": "OperationDefinition",
          "name": null,
          "operation": "query",
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": null,
                "argumentSet": {
                  "args": [
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "ruthyruthy",
                      },
                      "value": {
                        "comments": [],
                        "kind": "BooleanValue",
                        "value": true,
                      },
                    },
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "alsyalsy",
                      },
                      "value": {
                        "comments": [],
                        "kind": "BooleanValue",
                        "value": false,
                      },
                    },
                    {
                      "comments": [],
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "ullishullish",
                      },
                      "value": {
                        "comments": [],
                        "kind": "NullValue",
                      },
                    },
                  ],
                  "commentsClosingBracket": [],
                  "commentsOpeningBracket": [],
                  "kind": "ArgumentSet",
                },
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "nnamednnamed",
                },
                "selectionSet": null,
              },
              {
                "alias": null,
                "argumentSet": null,
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "ueryuery",
                },
                "selectionSet": null,
              },
            ],
          },
          "variableDefinitionSet": null,
        },
        {
          "comments": [],
          "directives": [],
          "kind": "OperationDefinition",
          "name": null,
          "operation": "query",
          "selectionSet": {
            "commentsClosingBracket": [],
            "commentsOpeningBracket": [],
            "kind": "SelectionSet",
            "selections": [
              {
                "alias": null,
                "argumentSet": null,
                "comments": [],
                "directives": [],
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "_typename_typename",
                },
                "selectionSet": null,
              },
            ],
          },
          "variableDefinitionSet": null,
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
    ArgumentSet: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    BlockComment: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
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
        debug.push(["enter", node.kind, "" + node.repeatable]);
      },
      leave(node) {
        debug.push(["leave", node.kind, "" + node.repeatable]);
      },
    },
    DirectiveLocationSet: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
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
    EnumValueDefinitionSet: {
      enter(node) {
        debug.push(["enter", node.kind]);
      },
      leave(node) {
        debug.push(["leave", node.kind]);
      },
    },
    ExecutableDirectiveLocation: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
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
    FieldDefinitionSet: {
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
    InlineComment: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
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
    InputValueDefinitionSet: {
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
    NamedTypeSet: {
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
    OperationTypeDefinitionSet: {
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
    SelectionSet: {
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
    TypeSystemDirectiveLocation: {
      enter(node) {
        debug.push(["enter", node.kind, node.value]);
      },
      leave(node) {
        debug.push(["leave", node.kind, node.value]);
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
    VariableDefinitionSet: {
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
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "BlockComment",
        "field block comment",
      ],
      [
        "leave",
        "BlockComment",
        "field block comment",
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
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "InlineComment",
        "field inline comment",
      ],
      [
        "leave",
        "InlineComment",
        "field inline comment",
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
        "SelectionSet",
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
        "leave",
        "SelectionSet",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "leave",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "SelectionSet",
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
        "SelectionSet",
      ],
      [
        "enter",
        "Directive",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "SelectionSet",
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
        "SelectionSet",
      ],
      [
        "leave",
        "InlineFragment",
      ],
      [
        "leave",
        "SelectionSet",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "leave",
        "SelectionSet",
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
        "VariableDefinitionSet",
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
        "leave",
        "VariableDefinitionSet",
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
        "BlockComment",
        "block comment
    with multiple lines",
      ],
      [
        "leave",
        "BlockComment",
        "block comment
    with multiple lines",
      ],
      [
        "enter",
        "BlockComment",
        "this is a new comment",
      ],
      [
        "leave",
        "BlockComment",
        "this is a new comment",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "leave",
        "SelectionSet",
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
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
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
        "leave",
        "SelectionSet",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "leave",
        "SelectionSet",
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
        "VariableDefinitionSet",
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
        "leave",
        "VariableDefinitionSet",
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
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "leave",
        "SelectionSet",
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
        "SelectionSet",
      ],
      [
        "enter",
        "Field",
      ],
      [
        "enter",
        "ArgumentSet",
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
        "leave",
        "ArgumentSet",
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
        "SelectionSet",
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
        "SelectionSet",
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
        "SelectionSet",
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
