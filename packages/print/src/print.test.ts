import type { AstNodes, CommentNode } from "@graphql-modular/language";
import { parse } from "@graphql-modular/parse";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { print } from "./print";

const KITCHEN_SINK = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "kitchenSink.gql"),
  "utf8"
);

describe("kitchen sink", () => {
  it("prints without comments", () => {
    expect(print(parse(KITCHEN_SINK))).toMatchInlineSnapshot(`
      "query queryName($foo:ComplexType,$site:Site=MOBILE)@onQuery{whoever123is:node(id:[123,456]){id,...on User@onInlineFragment{field2{id,alias:field1(first:10,after:$foo)@include(if:$foo){id,...frag@onFragmentSpread}}},...@skip(unless:$foo){id},...{id}}}
      mutation likeStory@onMutation{like(story:123)@onField{story{id@onField}}}
      subscription StoryLikeSubscription($input:StoryLikeSubscribeInput@onVariableDefinition)@onSubscription{storyLikeSubscribe(input:$input){story{likers{count},likeSentence{text}}}}
      fragment frag on Friend@onFragmentDefinition{foo(size:$size,bar:$b,obj:{key:\\"value\\",block:\\"\\"\\"
      block string uses \\\\\\"\\"\\"\\"\\"\\"})}
      {unnamed(truthy:true,falsy:false,nullish:null),query}
      {__typename}
      "
    `);
  });
  it("prints with comments", () => {
    expect(print(parse(KITCHEN_SINK), { preserveComments: true }))
      .toMatchInlineSnapshot(`
        "query queryName($foo:ComplexType,$site:Site=MOBILE)@onQuery{whoever123is:node(id:[123,456]){#field block comment
        id,...on User@onInlineFragment{field2{id#field inline comment
        ,alias:field1(first:10,after:$foo)@include(if:$foo){id,...frag@onFragmentSpread}}},...@skip(unless:$foo){id},...{id}}}
        #block comment
        #with multiple lines
        #this is a new comment
        mutation likeStory@onMutation{like(story:123)@onField{story{id@onField}}}
        subscription StoryLikeSubscription($input:StoryLikeSubscribeInput@onVariableDefinition)@onSubscription{storyLikeSubscribe(input:$input){story{likers{count},likeSentence{text}}}}
        fragment frag on Friend@onFragmentDefinition{foo(size:$size,bar:$b,obj:{key:\\"value\\",block:\\"\\"\\"
        block string uses \\\\\\"\\"\\"\\"\\"\\"})}
        {unnamed(truthy:true,falsy:false,nullish:null),query}
        {__typename}
        "
      `);
  });
});

const LANGUAGE = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "language.gql"),
  "utf8"
);

describe("idempotency for parsing-printing", () => {
  it("is idempotent without comments", () => {
    const language = print(parse(LANGUAGE));
    expect(print(parse(language))).toBe(language);
  });
  it("is idempotent with comments", () => {
    const language = print(parse(LANGUAGE), { preserveComments: true });
    expect(print(parse(language), { preserveComments: true })).toBe(language);
  });
});

const COMMENTS = fs.readFileSync(
  path.join(__dirname, "..", "..", "..", "utils", "comments.gql"),
  "utf8"
);

it("does not remove any comments", () => {
  const printed = print(parse(COMMENTS), { preserveComments: true });
  for (let i = 1; i <= 46; i++)
    expect(printed).toContain("#comment " + i + "\n");
});

const comments: CommentNode[] = [
  { kind: "BlockComment", value: "block comment" },
  { kind: "InlineComment", value: "inline comment" },
];

const commentsOpeningBracket: CommentNode[] = [
  { kind: "BlockComment", value: "block comment open" },
  { kind: "InlineComment", value: "inline comment open" },
];

const commentsClosingBracket: CommentNode[] = [
  { kind: "BlockComment", value: "block comment close" },
  { kind: "InlineComment", value: "inline comment close" },
];

describe("standard printing for ast nodes", () => {
  describe("Argument node", () => {
    const node: AstNodes["Argument"] = {
      kind: "Argument",
      comments,
      name: "name" as any,
      value: "value" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"name:value"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        name:value#inline comment
        "
      `);
    });
  });

  describe("ArgumentSet", () => {
    const node: AstNodes["ArgumentSet"] = {
      kind: "ArgumentSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      args: ["name1:value1", "name2:value2"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"(name1:value1,name2:value2)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        (#inline comment open
        name1:value1,name2:value2#block comment close
        )#inline comment close
        "
      `);
    });
  });

  describe("BlockComment", () => {
    const node: AstNodes["BlockComment"] = {
      kind: "BlockComment",
      value: "block comment",
    };
    describe("single comment", () => {
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          "
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node])).toMatchInlineSnapshot(`
          [
            "",
            "",
          ]
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true }))
          .toMatchInlineSnapshot(`
            [
              "#block comment
            ",
              "#block comment
            ",
            ]
          `);
      });
    });
  });

  describe("BooleanValue", () => {
    const node: AstNodes["BooleanValue"] = {
      kind: "BooleanValue",
      comments,
      value: true,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"true"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        true#inline comment
        "
      `);
    });
  });

  describe("Directive", () => {
    const node: AstNodes["Directive"] = {
      kind: "Directive",
      comments,
      name: "myDirective" as any,
      argumentSet: "(name:value)" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"@myDirective(name:value)"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        @myDirective#inline comment
        (name:value)"
      `);
    });
  });

  describe("DirectiveDefinition", () => {
    const node: AstNodes["DirectiveDefinition"] = {
      kind: "DirectiveDefinition",
      comments,
      description: '"some description"' as any,
      name: "myDirective" as any,
      inputValueDefinitionSet: "(name:Int=42)" as any,
      repeatable: true,
      locationSet: "on QUERY|MUTATION" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"some description\\" directive@myDirective(name:Int=42) repeatable on QUERY|MUTATION"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"some description\\" #block comment
        directive@myDirective#inline comment
        (name:Int=42) repeatable on QUERY|MUTATION"
      `);
    });
  });

  describe("DirectiveLocationSet", () => {
    const node: AstNodes["DirectiveLocationSet"] = {
      kind: "DirectiveLocationSet",
      comments,
      locations: ["QUERY", "MUTATION"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"on QUERY|MUTATION"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        on#inline comment
        QUERY|MUTATION"
      `);
    });
  });

  describe("Document", () => {
    const node: AstNodes["Document"] = {
      kind: "Document",
      comments,
      definitions: ["type MyObjectType{field:Int}"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(`
        "type MyObjectType{field:Int}
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "type MyObjectType{field:Int}
        #block comment
        #inline comment
        "
      `);
    });
  });

  describe("EnumTypeDefinition", () => {
    const node: AstNodes["EnumTypeDefinition"] = {
      kind: "EnumTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyEnumType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      valueDefinitionSet: "{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        enum MyEnumType#inline comment
        @myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumTypeExtension", () => {
    const node: AstNodes["EnumTypeExtension"] = {
      kind: "EnumTypeExtension",
      comments,
      name: "MyEnumType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      valueDefinitionSet: "{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend enum MyEnumType#inline comment
        @myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumValue", () => {
    const node: AstNodes["EnumValue"] = {
      kind: "EnumValue",
      comments,
      value: "MY_ENUM_VALUE",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"MY_ENUM_VALUE"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        MY_ENUM_VALUE#inline comment
        "
      `);
    });
  });

  describe("EnumValueDefinitionNode", () => {
    const node: AstNodes["EnumValueDefinition"] = {
      kind: "EnumValueDefinition",
      comments,
      description: '"my description"' as any,
      name: "MY_ENUM_VALUE" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" MY_ENUM_VALUE@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        MY_ENUM_VALUE#inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("EnumValueDefinitionSetNode", () => {
    const node: AstNodes["EnumValueDefinitionSet"] = {
      kind: "EnumValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["MY_ENUM_VALUE", "MY_OTHER_ENUM_VALUE"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(`
        "{MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE}"
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("ExecutableDirectiveLocation", () => {
    const node: AstNodes["ExecutableDirectiveLocation"] = {
      kind: "ExecutableDirectiveLocation",
      comments,
      value: "QUERY",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"QUERY"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        QUERY#inline comment
        "
      `);
    });
  });

  describe("Field", () => {
    const node: AstNodes["Field"] = {
      kind: "Field",
      comments,
      alias: "fieldAlias" as any,
      name: "fieldName" as any,
      argumentSet: "(argName:42)" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{subField}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"fieldAlias:fieldName(argName:42)@myDirective@myOtherDirective{subField}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        fieldAlias:fieldName#inline comment
        (argName:42)@myDirective@myOtherDirective{subField}"
      `);
    });
  });

  describe("FieldDefinition", () => {
    const node: AstNodes["FieldDefinition"] = {
      kind: "FieldDefinition",
      comments,
      description: '"my description"' as any,
      name: "fieldName" as any,
      inputValueDefinitionSet: "(argName:MyInputType=42)" as any,
      type: "MyOutputType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" fieldName(argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        fieldName#inline comment
        (argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"
      `);
    });
  });

  describe("FieldDefinitionSet", () => {
    const node: AstNodes["FieldDefinitionSet"] = {
      kind: "FieldDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        "field1:MyOutputType1",
        "field2(argName:MyInputType=42):MyOutputType2",
      ] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("FloatValue", () => {
    const node: AstNodes["FloatValue"] = {
      kind: "FloatValue",
      comments,
      value: "42.43e44",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"42.43e44"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        42.43e44#inline comment
        "
      `);
    });
  });

  describe("FragmentDefinition", () => {
    const node: AstNodes["FragmentDefinition"] = {
      kind: "FragmentDefinition",
      comments,
      name: "MyFragmentName" as any,
      typeCondition: "MyType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{field}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"fragment MyFragmentName on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        fragment MyFragmentName#inline comment
        on MyType@myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("FragmentSpread", () => {
    const node: AstNodes["FragmentSpread"] = {
      kind: "FragmentSpread",
      comments,
      name: "MyFragmentName" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"...MyFragmentName@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        ...MyFragmentName#inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("InlineComment", () => {
    const node: AstNodes["InlineComment"] = {
      kind: "InlineComment",
      value: "inline comment",
    };
    describe("single comment", () => {
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#inline comment
          "
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node])).toMatchInlineSnapshot(`
          [
            "",
            "",
          ]
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true }))
          .toMatchInlineSnapshot(`
            [
              "#inline comment
            ",
              "#inline comment
            ",
            ]
          `);
      });
    });
  });

  describe("InlineFragment", () => {
    const node: AstNodes["InlineFragment"] = {
      kind: "InlineFragment",
      comments,
      typeCondition: "MyType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{field}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"...on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        ...on MyType#inline comment
        @myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("InputObjectTypeDefinition", () => {
    const node: AstNodes["InputObjectTypeDefinition"] = {
      kind: "InputObjectTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyInputObjectType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      inputValueDefinitionSet: "{field:MyInputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        input MyInputObjectType#inline comment
        @myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputObjectTypeExtension", () => {
    const node: AstNodes["InputObjectTypeExtension"] = {
      kind: "InputObjectTypeExtension",
      comments,
      name: "MyInputObjectType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      inputValueDefinitionSet: "{field:MyInputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend input MyInputObjectType#inline comment
        @myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputValueDefinition", () => {
    const node: AstNodes["InputValueDefinition"] = {
      kind: "InputValueDefinition",
      comments,
      description: '"my description"' as any,
      name: "inputField" as any,
      type: "MyInputType" as any,
      defaultValue: "42" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" inputField:MyInputType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        inputField:#inline comment
        MyInputType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("InputValueDefinitionSet", () => {
    const node: AstNodes["InputValueDefinitionSet"] = {
      kind: "InputValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        "inputField1:MyInputType1",
        "inputField2:MyInputType2=42",
      ] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(`
        "{inputField1:MyInputType1,inputField2:MyInputType2=42}"
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        inputField1:MyInputType1,inputField2:MyInputType2=42#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("InterfaceTypeDefinition", () => {
    const node: AstNodes["InterfaceTypeDefinition"] = {
      kind: "InterfaceTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyInterfaceType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        interface MyInterfaceType#inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("InterfaceTypeExtension", () => {
    const node: AstNodes["InterfaceTypeExtension"] = {
      kind: "InterfaceTypeExtension",
      comments,
      name: "MyInterfaceType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend interface MyInterfaceType#inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("IntValue", () => {
    const node: AstNodes["IntValue"] = {
      kind: "IntValue",
      comments,
      value: "42",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"42"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        42#inline comment
        "
      `);
    });
  });

  describe("ListType", () => {
    const node: AstNodes["ListType"] = {
      kind: "ListType",
      comments,
      type: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"[MyType]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        [MyType]#inline comment
        "
      `);
    });
  });

  describe("ListValue", () => {
    const node: AstNodes["ListValue"] = {
      kind: "ListValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      values: ["42", "43"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"[42,43]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        [#inline comment open
        42,43#block comment close
        ]#inline comment close
        "
      `);
    });
  });

  describe("Name", () => {
    const node: AstNodes["Name"] = {
      kind: "Name",
      value: "myName",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"myName"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(
        '"myName"'
      );
    });
  });

  describe("NamedType", () => {
    const node: AstNodes["NamedType"] = {
      kind: "NamedType",
      comments,
      name: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"MyType"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        MyType#inline comment
        "
      `);
    });
  });

  describe("NamedTypeSet", () => {
    const node: AstNodes["NamedTypeSet"] = {
      kind: "NamedTypeSet",
      comments,
      types: ["MyType1", "MyType2"] as any,
    };
    describe("when printing standalone", () => {
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot('"MyType1,MyType2"');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          #inline comment
          MyType1,MyType2"
        `);
      });
    });
    describe("when printing as child of an object type definition", () => {
      const parent: AstNodes["ObjectTypeDefinition"] = {
        kind: "ObjectTypeDefinition",
        comments: [],
        description: null,
        name: "MyObjectType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"type MyObjectType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "type MyObjectType #block comment
            implements#inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an object type extension", () => {
      const parent: AstNodes["ObjectTypeExtension"] = {
        kind: "ObjectTypeExtension",
        comments: [],
        name: "MyObjectType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"extend type MyObjectType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "extend type MyObjectType #block comment
            implements#inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type definition", () => {
      const parent: AstNodes["InterfaceTypeDefinition"] = {
        kind: "InterfaceTypeDefinition",
        comments: [],
        description: null,
        name: "MyInterfaceType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"interface MyInterfaceType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "interface MyInterfaceType #block comment
            implements#inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type extension", () => {
      const parent: AstNodes["InterfaceTypeExtension"] = {
        kind: "InterfaceTypeExtension",
        comments: [],
        name: "MyInterfaceType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"extend interface MyInterfaceType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "extend interface MyInterfaceType #block comment
            implements#inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an union type definition", () => {
      const parent: AstNodes["UnionTypeDefinition"] = {
        kind: "UnionTypeDefinition",
        comments: [],
        description: null,
        name: "MyUnionType" as any,
        directives: [],
        types: node,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "union MyUnionType#block comment
            =#inline comment
            MyType1|MyType2"
          `);
      });
    });
    describe("when printing as child of an union type extension", () => {
      const parent: AstNodes["UnionTypeExtension"] = {
        kind: "UnionTypeExtension",
        comments: [],
        name: "MyUnionType" as any,
        directives: [],
        types: node,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"extend union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "extend union MyUnionType#block comment
            =#inline comment
            MyType1|MyType2"
          `);
      });
    });
  });

  describe("NonNullType", () => {
    const node: AstNodes["NonNullType"] = {
      kind: "NonNullType",
      comments,
      type: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"MyType!"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        MyType!#inline comment
        "
      `);
    });
  });

  describe("NullValue", () => {
    const node: AstNodes["NullValue"] = {
      kind: "NullValue",
      comments,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"null"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        null#inline comment
        "
      `);
    });
  });

  describe("ObjectField", () => {
    const node: AstNodes["ObjectField"] = {
      kind: "ObjectField",
      comments,
      name: "fieldName" as any,
      value: "42" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"fieldName:42"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        fieldName:42#inline comment
        "
      `);
    });
  });

  describe("ObjectTypeDefinition", () => {
    const node: AstNodes["ObjectTypeDefinition"] = {
      kind: "ObjectTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyObjectType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        type MyObjectType#inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectTypeExtension", () => {
    const node: AstNodes["ObjectTypeExtension"] = {
      kind: "ObjectTypeExtension",
      comments,
      name: "MyObjectType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend type MyObjectType#inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectValue", () => {
    const node: AstNodes["ObjectValue"] = {
      kind: "ObjectValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      fields: ["fieldName1:42", 'fieldName2:"some string"'] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{fieldName1:42,fieldName2:\\"some string\\"}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        fieldName1:42,fieldName2:\\"some string\\"#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("OperationDefinition", () => {
    describe("using query shorthand", () => {
      const node: AstNodes["OperationDefinition"] = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: null,
        variableDefinitionSet: null,
        directives: [],
        selectionSet: "{field1,field2(arg:42)}" as any,
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot('"{field1,field2(arg:42)}"');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(
          '"{field1,field2(arg:42)}"'
        );
      });
    });
    describe("using elaborate form", () => {
      const node: AstNodes["OperationDefinition"] = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: "MyOperation" as any,
        variableDefinitionSet: "($myVariable:Int=42)" as any,
        directives: ["@myDirective", "@myOtherDirective"] as any,
        selectionSet: "{field1,field2(arg:42)}" as any,
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot(
          '"query MyOperation($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"'
        );
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          query MyOperation#inline comment
          ($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"
        `);
      });
    });
  });

  describe("OperationTypeDefinition", () => {
    const node: AstNodes["OperationTypeDefinition"] = {
      kind: "OperationTypeDefinition",
      comments,
      operation: "query",
      type: "MyOutputType" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"query:MyOutputType"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        query:#inline comment
        MyOutputType"
      `);
    });
  });

  describe("OperationTypeDefinitionSet", () => {
    const node: AstNodes["OperationTypeDefinitionSet"] = {
      kind: "OperationTypeDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["query:MyOutputType1", "mutation:MyOutputType2"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{query:MyOutputType1,mutation:MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        query:MyOutputType1,mutation:MyOutputType2#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("ScalarTypeDefinition", () => {
    const node: AstNodes["ScalarTypeDefinition"] = {
      kind: "ScalarTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyScalarType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        scalar MyScalarType#inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("ScalarTypeExtension", () => {
    const node: AstNodes["ScalarTypeExtension"] = {
      kind: "ScalarTypeExtension",
      comments,
      name: "MyScalarType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend scalar MyScalarType#inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("SchemaDefinition", () => {
    const node: AstNodes["SchemaDefinition"] = {
      kind: "SchemaDefinition",
      comments,
      description: '"my description"' as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      operationTypeDefinitionSet: "{query:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        schema#inline comment
        @myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SchemaExtension", () => {
    const node: AstNodes["SchemaExtension"] = {
      kind: "SchemaExtension",
      comments,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      operationTypeDefinitionSet: "{query:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend schema#inline comment
        @myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SelectionSet", () => {
    const node: AstNodes["SelectionSet"] = {
      kind: "SelectionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      selections: ["field1", "field2(arg:42)"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"{field1,field2(arg:42)}"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        {#inline comment open
        field1,field2(arg:42)#block comment close
        }#inline comment close
        "
      `);
    });
  });

  describe("StringValue", () => {
    describe("regular string values", () => {
      const node: AstNodes["StringValue"] = {
        kind: "StringValue",
        comments,
        block: false,
        value: "my string",
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot('"\\"my string\\""');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          \\"my string\\"#inline comment
          "
        `);
      });
    });
    describe("block string values", () => {
      const node: AstNodes["StringValue"] = {
        kind: "StringValue",
        comments,
        block: true,
        value: 'my """ string',
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot(`
          "\\"\\"\\"
          my \\\\\\"\\"\\" string\\"\\"\\""
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          \\"\\"\\"
          my \\\\\\"\\"\\" string\\"\\"\\"#inline comment
          "
        `);
      });
    });
  });

  describe("TypeSystemDirectiveLocation", () => {
    const node: AstNodes["TypeSystemDirectiveLocation"] = {
      kind: "TypeSystemDirectiveLocation",
      comments,
      value: "OBJECT",
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"OBJECT"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        OBJECT#inline comment
        "
      `);
    });
  });

  describe("UnionTypeDefinition", () => {
    const node: AstNodes["UnionTypeDefinition"] = {
      kind: "UnionTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyUnionType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      types: "=MyType1|MyType2" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\" union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\" #block comment
        union MyUnionType#inline comment
        @myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("UnionTypeExtension", () => {
    const node: AstNodes["UnionTypeExtension"] = {
      kind: "UnionTypeExtension",
      comments,
      name: "MyUnionType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      types: "=MyType1|MyType2" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        extend union MyUnionType#inline comment
        @myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("Variable", () => {
    const node: AstNodes["Variable"] = {
      kind: "Variable",
      comments,
      name: "myVariable" as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"$myVariable"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        $myVariable#inline comment
        "
      `);
    });
  });

  describe("VariableDefinition", () => {
    const node: AstNodes["VariableDefinition"] = {
      kind: "VariableDefinition",
      comments,
      variable: "$myVariable" as any,
      type: "MyType" as any,
      defaultValue: "42" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"$myVariable:MyType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        $myVariable:#inline comment
        MyType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("VariableDefinitionSet", () => {
    const node: AstNodes["VariableDefinitionSet"] = {
      kind: "VariableDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["$myVariable:MyType", "$myVariable:MyOtherType"] as any,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"($myVariable:MyType,$myVariable:MyOtherType)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        (#inline comment open
        $myVariable:MyType,$myVariable:MyOtherType#block comment close
        )#inline comment close
        "
      `);
    });
  });
});

describe("pretty printing for ast nodes", () => {
  describe("Argument node", () => {
    const node: AstNodes["Argument"] = {
      kind: "Argument",
      comments,
      name: "name" as any,
      value: "value" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"name:value"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        name:value # inline comment
        "
      `);
    });
  });

  describe("ArgumentSet", () => {
    const node: AstNodes["ArgumentSet"] = {
      kind: "ArgumentSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      args: ["name1:value1", "name2:value2"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"(name1:value1,name2:value2)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        ( # inline comment open
        name1:value1,name2:value2
        # block comment close
        ) # inline comment close
        "
      `);
    });
  });

  describe("BlockComment", () => {
    const node: AstNodes["BlockComment"] = {
      kind: "BlockComment",
      value: "block comment",
    };
    describe("single comment", () => {
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "
          # block comment
          "
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node], { pretty: true })).toMatchInlineSnapshot(`
          [
            "",
            "",
          ]
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            [
              "
            # block comment
            ",
              "
            # block comment
            ",
            ]
          `);
      });
    });
  });

  describe("BooleanValue", () => {
    const node: AstNodes["BooleanValue"] = {
      kind: "BooleanValue",
      comments,
      value: true,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"true"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        true # inline comment
        "
      `);
    });
  });

  describe("Directive", () => {
    const node: AstNodes["Directive"] = {
      kind: "Directive",
      comments,
      name: "myDirective" as any,
      argumentSet: "(name:value)" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"@myDirective(name:value)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        @myDirective # inline comment
        (name:value)"
      `);
    });
  });

  describe("DirectiveDefinition", () => {
    const node: AstNodes["DirectiveDefinition"] = {
      kind: "DirectiveDefinition",
      comments,
      description: '"some description"' as any,
      name: "myDirective" as any,
      inputValueDefinitionSet: "(name:Int=42)" as any,
      repeatable: true,
      locationSet: "on QUERY|MUTATION" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"some description\\" directive @myDirective(name:Int=42) repeatable on QUERY|MUTATION"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"some description\\" 
        # block comment
        directive @myDirective # inline comment
        (name:Int=42) repeatable on QUERY|MUTATION"
      `);
    });
  });

  describe("DirectiveLocationSet", () => {
    const node: AstNodes["DirectiveLocationSet"] = {
      kind: "DirectiveLocationSet",
      comments,
      locations: ["QUERY", "MUTATION"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"on QUERY|MUTATION"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        on # inline comment
        QUERY|MUTATION"
      `);
    });
  });

  describe("Document", () => {
    const node: AstNodes["Document"] = {
      kind: "Document",
      comments,
      definitions: ["type MyObjectType{field:Int}"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "type MyObjectType{field:Int}
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "type MyObjectType{field:Int}
        
        # block comment
        # inline comment
        "
      `);
    });
  });

  describe("EnumTypeDefinition", () => {
    const node: AstNodes["EnumTypeDefinition"] = {
      kind: "EnumTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyEnumType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      valueDefinitionSet: "{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        enum MyEnumType # inline comment
        @myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumTypeExtension", () => {
    const node: AstNodes["EnumTypeExtension"] = {
      kind: "EnumTypeExtension",
      comments,
      name: "MyEnumType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      valueDefinitionSet: "{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend enum MyEnumType # inline comment
        @myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumValue", () => {
    const node: AstNodes["EnumValue"] = {
      kind: "EnumValue",
      comments,
      value: "MY_ENUM_VALUE",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"MY_ENUM_VALUE"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        MY_ENUM_VALUE # inline comment
        "
      `);
    });
  });

  describe("EnumValueDefinitionNode", () => {
    const node: AstNodes["EnumValueDefinition"] = {
      kind: "EnumValueDefinition",
      comments,
      description: '"my description"' as any,
      name: "MY_ENUM_VALUE" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" MY_ENUM_VALUE@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        MY_ENUM_VALUE # inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("EnumValueDefinitionSetNode", () => {
    const node: AstNodes["EnumValueDefinitionSet"] = {
      kind: "EnumValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["MY_ENUM_VALUE", "MY_OTHER_ENUM_VALUE"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE}"
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("ExecutableDirectiveLocation", () => {
    const node: AstNodes["ExecutableDirectiveLocation"] = {
      kind: "ExecutableDirectiveLocation",
      comments,
      value: "QUERY",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"QUERY"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        QUERY # inline comment
        "
      `);
    });
  });

  describe("Field", () => {
    const node: AstNodes["Field"] = {
      kind: "Field",
      comments,
      alias: "fieldAlias" as any,
      name: "fieldName" as any,
      argumentSet: "(argName:42)" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{subField}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"fieldAlias:fieldName(argName:42)@myDirective@myOtherDirective{subField}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        fieldAlias:fieldName # inline comment
        (argName:42)@myDirective@myOtherDirective{subField}"
      `);
    });
  });

  describe("FieldDefinition", () => {
    const node: AstNodes["FieldDefinition"] = {
      kind: "FieldDefinition",
      comments,
      description: '"my description"' as any,
      name: "fieldName" as any,
      inputValueDefinitionSet: "(argName:MyInputType=42)" as any,
      type: "MyOutputType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" fieldName(argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        fieldName # inline comment
        (argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"
      `);
    });
  });

  describe("FieldDefinitionSet", () => {
    const node: AstNodes["FieldDefinitionSet"] = {
      kind: "FieldDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        "field1:MyOutputType1",
        "field2(argName:MyInputType=42):MyOutputType2",
      ] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"{field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("FloatValue", () => {
    const node: AstNodes["FloatValue"] = {
      kind: "FloatValue",
      comments,
      value: "42.43e44",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"42.43e44"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        42.43e44 # inline comment
        "
      `);
    });
  });

  describe("FragmentDefinition", () => {
    const node: AstNodes["FragmentDefinition"] = {
      kind: "FragmentDefinition",
      comments,
      name: "MyFragmentName" as any,
      typeCondition: "MyType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{field}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"fragment MyFragmentName on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        fragment MyFragmentName # inline comment
        on MyType@myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("FragmentSpread", () => {
    const node: AstNodes["FragmentSpread"] = {
      kind: "FragmentSpread",
      comments,
      name: "MyFragmentName" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"...MyFragmentName@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        ...MyFragmentName # inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("InlineComment", () => {
    const node: AstNodes["InlineComment"] = {
      kind: "InlineComment",
      value: "inline comment",
    };
    describe("single comment", () => {
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "# inline comment
          "
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node], { pretty: true })).toMatchInlineSnapshot(`
          [
            "",
            "",
          ]
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            [
              "# inline comment
            ",
              "# inline comment
            ",
            ]
          `);
      });
    });
  });

  describe("InlineFragment", () => {
    const node: AstNodes["InlineFragment"] = {
      kind: "InlineFragment",
      comments,
      typeCondition: "MyType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      selectionSet: "{field}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"...on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        ...on MyType # inline comment
        @myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("InputObjectTypeDefinition", () => {
    const node: AstNodes["InputObjectTypeDefinition"] = {
      kind: "InputObjectTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyInputObjectType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      inputValueDefinitionSet: "{field:MyInputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        input MyInputObjectType # inline comment
        @myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputObjectTypeExtension", () => {
    const node: AstNodes["InputObjectTypeExtension"] = {
      kind: "InputObjectTypeExtension",
      comments,
      name: "MyInputObjectType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      inputValueDefinitionSet: "{field:MyInputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend input MyInputObjectType # inline comment
        @myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputValueDefinition", () => {
    const node: AstNodes["InputValueDefinition"] = {
      kind: "InputValueDefinition",
      comments,
      description: '"my description"' as any,
      name: "inputField" as any,
      type: "MyInputType" as any,
      defaultValue: "42" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" inputField:MyInputType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        inputField: # inline comment
        MyInputType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("InputValueDefinitionSet", () => {
    const node: AstNodes["InputValueDefinitionSet"] = {
      kind: "InputValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        "inputField1:MyInputType1",
        "inputField2:MyInputType2=42",
      ] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{inputField1:MyInputType1,inputField2:MyInputType2=42}"
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        inputField1:MyInputType1,inputField2:MyInputType2=42
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("InterfaceTypeDefinition", () => {
    const node: AstNodes["InterfaceTypeDefinition"] = {
      kind: "InterfaceTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyInterfaceType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        interface MyInterfaceType # inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("InterfaceTypeExtension", () => {
    const node: AstNodes["InterfaceTypeExtension"] = {
      kind: "InterfaceTypeExtension",
      comments,
      name: "MyInterfaceType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend interface MyInterfaceType # inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("IntValue", () => {
    const node: AstNodes["IntValue"] = {
      kind: "IntValue",
      comments,
      value: "42",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"42"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        42 # inline comment
        "
      `);
    });
  });

  describe("ListType", () => {
    const node: AstNodes["ListType"] = {
      kind: "ListType",
      comments,
      type: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"[MyType]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        [MyType] # inline comment
        "
      `);
    });
  });

  describe("ListValue", () => {
    const node: AstNodes["ListValue"] = {
      kind: "ListValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      values: ["42", "43"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"[42,43]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        [ # inline comment open
        42,43
        # block comment close
        ] # inline comment close
        "
      `);
    });
  });

  describe("Name", () => {
    const node: AstNodes["Name"] = {
      kind: "Name",
      value: "myName",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"myName"');
    });
    it("prints with comments", () => {
      expect(
        print(node, { preserveComments: true, pretty: true })
      ).toMatchInlineSnapshot('"myName"');
    });
  });

  describe("NamedType", () => {
    const node: AstNodes["NamedType"] = {
      kind: "NamedType",
      comments,
      name: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"MyType"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        MyType # inline comment
        "
      `);
    });
  });

  describe("NamedTypeSet", () => {
    const node: AstNodes["NamedTypeSet"] = {
      kind: "NamedTypeSet",
      comments,
      types: ["MyType1", "MyType2"] as any,
    };
    describe("when printing standalone", () => {
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(
          '"MyType1,MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "
          # block comment
          # inline comment
          MyType1,MyType2"
        `);
      });
    });
    describe("when printing as child of an object type definition", () => {
      const parent: AstNodes["ObjectTypeDefinition"] = {
        kind: "ObjectTypeDefinition",
        comments: [],
        description: null,
        name: "MyObjectType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"type MyObjectType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "type MyObjectType 
            # block comment
            implements # inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an object type extension", () => {
      const parent: AstNodes["ObjectTypeExtension"] = {
        kind: "ObjectTypeExtension",
        comments: [],
        name: "MyObjectType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"extend type MyObjectType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "extend type MyObjectType 
            # block comment
            implements # inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type definition", () => {
      const parent: AstNodes["InterfaceTypeDefinition"] = {
        kind: "InterfaceTypeDefinition",
        comments: [],
        description: null,
        name: "MyInterfaceType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"interface MyInterfaceType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "interface MyInterfaceType 
            # block comment
            implements # inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type extension", () => {
      const parent: AstNodes["InterfaceTypeExtension"] = {
        kind: "InterfaceTypeExtension",
        comments: [],
        name: "MyInterfaceType" as any,
        interfaces: node,
        directives: [],
        fieldDefinitionSet: null,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"extend interface MyInterfaceType implements MyType1&MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "extend interface MyInterfaceType 
            # block comment
            implements # inline comment
            MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an union type definition", () => {
      const parent: AstNodes["UnionTypeDefinition"] = {
        kind: "UnionTypeDefinition",
        comments: [],
        description: null,
        name: "MyUnionType" as any,
        directives: [],
        types: node,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "union MyUnionType
            # block comment
            = # inline comment
            MyType1|MyType2"
          `);
      });
    });
    describe("when printing as child of an union type extension", () => {
      const parent: AstNodes["UnionTypeExtension"] = {
        kind: "UnionTypeExtension",
        comments: [],
        name: "MyUnionType" as any,
        directives: [],
        types: node,
      };
      it("prints without comments", () => {
        expect(print(parent, { pretty: true })).toMatchInlineSnapshot(
          '"extend union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "extend union MyUnionType
            # block comment
            = # inline comment
            MyType1|MyType2"
          `);
      });
    });
  });

  describe("NonNullType", () => {
    const node: AstNodes["NonNullType"] = {
      kind: "NonNullType",
      comments,
      type: "MyType" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"MyType!"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        MyType! # inline comment
        "
      `);
    });
  });

  describe("NullValue", () => {
    const node: AstNodes["NullValue"] = {
      kind: "NullValue",
      comments,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"null"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        null # inline comment
        "
      `);
    });
  });

  describe("ObjectField", () => {
    const node: AstNodes["ObjectField"] = {
      kind: "ObjectField",
      comments,
      name: "fieldName" as any,
      value: "42" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"fieldName:42"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        fieldName:42 # inline comment
        "
      `);
    });
  });

  describe("ObjectTypeDefinition", () => {
    const node: AstNodes["ObjectTypeDefinition"] = {
      kind: "ObjectTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyObjectType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        type MyObjectType # inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectTypeExtension", () => {
    const node: AstNodes["ObjectTypeExtension"] = {
      kind: "ObjectTypeExtension",
      comments,
      name: "MyObjectType" as any,
      interfaces: "implements MyInterfaceType1 & MyInterfaceType2" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      fieldDefinitionSet: "{field:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend type MyObjectType # inline comment
        implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectValue", () => {
    const node: AstNodes["ObjectValue"] = {
      kind: "ObjectValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      fields: ["fieldName1:42", 'fieldName2:"some string"'] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"{fieldName1:42,fieldName2:\\"some string\\"}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        fieldName1:42,fieldName2:\\"some string\\"
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("OperationDefinition", () => {
    describe("using query shorthand", () => {
      const node: AstNodes["OperationDefinition"] = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: null,
        variableDefinitionSet: null,
        directives: [],
        selectionSet: "{field1,field2(arg:42)}" as any,
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(
          '"{field1,field2(arg:42)}"'
        );
      });
      it("prints with comments", () => {
        expect(
          print(node, { preserveComments: true, pretty: true })
        ).toMatchInlineSnapshot('"{field1,field2(arg:42)}"');
      });
    });
    describe("using elaborate form", () => {
      const node: AstNodes["OperationDefinition"] = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: "MyOperation" as any,
        variableDefinitionSet: "($myVariable:Int=42)" as any,
        directives: ["@myDirective", "@myOtherDirective"] as any,
        selectionSet: "{field1,field2(arg:42)}" as any,
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(
          '"query MyOperation($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"'
        );
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "
          # block comment
          query MyOperation # inline comment
          ($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"
        `);
      });
    });
  });

  describe("OperationTypeDefinition", () => {
    const node: AstNodes["OperationTypeDefinition"] = {
      kind: "OperationTypeDefinition",
      comments,
      operation: "query",
      type: "MyOutputType" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"query:MyOutputType"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        query: # inline comment
        MyOutputType"
      `);
    });
  });

  describe("OperationTypeDefinitionSet", () => {
    const node: AstNodes["OperationTypeDefinitionSet"] = {
      kind: "OperationTypeDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["query:MyOutputType1", "mutation:MyOutputType2"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"{query:MyOutputType1,mutation:MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        query:MyOutputType1,mutation:MyOutputType2
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("ScalarTypeDefinition", () => {
    const node: AstNodes["ScalarTypeDefinition"] = {
      kind: "ScalarTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyScalarType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        scalar MyScalarType # inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("ScalarTypeExtension", () => {
    const node: AstNodes["ScalarTypeExtension"] = {
      kind: "ScalarTypeExtension",
      comments,
      name: "MyScalarType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend scalar MyScalarType # inline comment
        @myDirective@myOtherDirective"
      `);
    });
  });

  describe("SchemaDefinition", () => {
    const node: AstNodes["SchemaDefinition"] = {
      kind: "SchemaDefinition",
      comments,
      description: '"my description"' as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      operationTypeDefinitionSet: "{query:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        schema # inline comment
        @myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SchemaExtension", () => {
    const node: AstNodes["SchemaExtension"] = {
      kind: "SchemaExtension",
      comments,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      operationTypeDefinitionSet: "{query:MyOutputType}" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend schema # inline comment
        @myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SelectionSet", () => {
    const node: AstNodes["SelectionSet"] = {
      kind: "SelectionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      selections: ["field1", "field2(arg:42)"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"{field1,field2(arg:42)}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        { # inline comment open
        field1,field2(arg:42)
        # block comment close
        } # inline comment close
        "
      `);
    });
  });

  describe("StringValue", () => {
    describe("regular string values", () => {
      const node: AstNodes["StringValue"] = {
        kind: "StringValue",
        comments,
        block: false,
        value: "my string",
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(
          '"\\"my string\\""'
        );
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "
          # block comment
          \\"my string\\" # inline comment
          "
        `);
      });
    });
    describe("block string values", () => {
      const node: AstNodes["StringValue"] = {
        kind: "StringValue",
        comments,
        block: true,
        value: 'my """ string',
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "\\"\\"\\"
          my \\\\\\"\\"\\" string\\"\\"\\""
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "
          # block comment
          \\"\\"\\"
          my \\\\\\"\\"\\" string\\"\\"\\" # inline comment
          "
        `);
      });
    });
  });

  describe("TypeSystemDirectiveLocation", () => {
    const node: AstNodes["TypeSystemDirectiveLocation"] = {
      kind: "TypeSystemDirectiveLocation",
      comments,
      value: "OBJECT",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot('"OBJECT"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        OBJECT # inline comment
        "
      `);
    });
  });

  describe("UnionTypeDefinition", () => {
    const node: AstNodes["UnionTypeDefinition"] = {
      kind: "UnionTypeDefinition",
      comments,
      description: '"my description"' as any,
      name: "MyUnionType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      types: "=MyType1|MyType2" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"\\"my description\\" union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "\\"my description\\" 
        # block comment
        union MyUnionType # inline comment
        @myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("UnionTypeExtension", () => {
    const node: AstNodes["UnionTypeExtension"] = {
      kind: "UnionTypeExtension",
      comments,
      name: "MyUnionType" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
      types: "=MyType1|MyType2" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"extend union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        extend union MyUnionType # inline comment
        @myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("Variable", () => {
    const node: AstNodes["Variable"] = {
      kind: "Variable",
      comments,
      name: "myVariable" as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"$myVariable"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        $myVariable # inline comment
        "
      `);
    });
  });

  describe("VariableDefinition", () => {
    const node: AstNodes["VariableDefinition"] = {
      kind: "VariableDefinition",
      comments,
      variable: "$myVariable" as any,
      type: "MyType" as any,
      defaultValue: "42" as any,
      directives: ["@myDirective", "@myOtherDirective"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"$myVariable:MyType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment
        $myVariable: # inline comment
        MyType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("VariableDefinitionSet", () => {
    const node: AstNodes["VariableDefinitionSet"] = {
      kind: "VariableDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: ["$myVariable:MyType", "$myVariable:MyOtherType"] as any,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(
        '"($myVariable:MyType,$myVariable:MyOtherType)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "
        # block comment open
        ( # inline comment open
        $myVariable:MyType,$myVariable:MyOtherType
        # block comment close
        ) # inline comment close
        "
      `);
    });
  });
});
