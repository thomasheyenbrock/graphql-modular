import type { AstNode, AstNodes, CommentNode } from "@graphql-modular/language";
import { parse } from "@graphql-modular/parse";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { print as typedPrint, Stringified } from "./print";

type StringifiedPrint = (
  ...args:
    | [AstNode | AstNode[] | Stringified<AstNode>]
    | [
        AstNode | AstNode[] | Stringified<AstNode>,
        Parameters<typeof typedPrint>[1]
      ]
) => string;

const print = typedPrint as StringifiedPrint;

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
      block string uses \\\\\\"\\"\\"
      \\"\\"\\"})}
      {unnamed(truthy:true,falsy:false,nullish:null),query}
      {__typename}"
    `);
  });
  it("prints with comments", () => {
    expect(print(parse(KITCHEN_SINK), { preserveComments: true }))
      .toMatchInlineSnapshot(`
        "query queryName($foo:ComplexType,$site:Site=MOBILE)@onQuery{whoever123is:node(id:[123,456]){
        #field block comment
        id,...on User@onInlineFragment{field2{
        #field inline comment
        id,alias:field1(first:10,after:$foo)@include(if:$foo){id,...frag@onFragmentSpread}}},...@skip(unless:$foo){id},...{id}}}
        
        #block comment
        #with multiple lines
        #this is a new comment
        mutation likeStory@onMutation{like(story:123)@onField{story{id@onField}}}
        subscription StoryLikeSubscription($input:StoryLikeSubscribeInput@onVariableDefinition)@onSubscription{storyLikeSubscribe(input:$input){story{likers{count},likeSentence{text}}}}
        fragment frag on Friend@onFragmentDefinition{foo(size:$size,bar:$b,obj:{key:\\"value\\",block:\\"\\"\\"
        block string uses \\\\\\"\\"\\"
        \\"\\"\\"})}
        {unnamed(truthy:true,falsy:false,nullish:null),query}
        {__typename}"
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

describe("preserving comments", () => {
  it("does not remove any comments when standard printing", () => {
    const printed = print(parse(COMMENTS), { preserveComments: true });
    for (let i = 1; i <= 46; i++)
      expect(printed).toMatch(new RegExp("#comment " + i + "(\\n|#|$)"));
  });
  it("does not remove any comments when pretty printing", () => {
    const printed = print(parse(COMMENTS), {
      preserveComments: true,
      pretty: true,
    });
    for (let i = 1; i <= 46; i++)
      expect(printed).toMatch(new RegExp("# comment " + i + "(\\n| |$)"));
  });
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
    const node: Stringified<AstNodes["Argument"]> = {
      kind: "Argument",
      comments,
      name: ["name"],
      value: ['"value"'],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"name:\\"value\\""');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        name:\\"value\\""
      `);
    });
  });

  describe("ArgumentSet", () => {
    const node: Stringified<AstNodes["ArgumentSet"]> = {
      kind: "ArgumentSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      args: [["name1:value1"], ["name2:value2"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"(name1:value1,name2:value2)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        (name1:value1,name2:value2
        #block comment close
        #inline comment close
        )"
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
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(
          '"#block comment"'
        );
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node])).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true }))
          .toMatchInlineSnapshot(`
          "#block comment
          #block comment"
        `);
      });
    });
  });

  describe("BooleanValue", () => {
    const node: Stringified<AstNodes["BooleanValue"]> = {
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
        #inline comment
        true"
      `);
    });
  });

  describe("Directive", () => {
    const node: Stringified<AstNodes["Directive"]> = {
      kind: "Directive",
      comments,
      name: ["myDirective"],
      argumentSet: ["(name:value)"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"@myDirective(name:value)"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        @myDirective(name:value)"
      `);
    });
  });

  describe("DirectiveDefinition", () => {
    const node: Stringified<AstNodes["DirectiveDefinition"]> = {
      kind: "DirectiveDefinition",
      comments,
      description: ['"my description"'],
      name: ["myDirective"],
      inputValueDefinitionSet: ["(name:Int=42)"],
      repeatable: true,
      locationSet: ["on QUERY|MUTATION"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"directive@myDirective(name:Int=42) repeatable on QUERY|MUTATION"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        directive@myDirective(name:Int=42) repeatable on QUERY|MUTATION"
      `);
    });
  });

  describe("DirectiveLocationSet", () => {
    const node: Stringified<AstNodes["DirectiveLocationSet"]> = {
      kind: "DirectiveLocationSet",
      comments,
      locations: [["QUERY"], ["MUTATION"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"on QUERY|MUTATION"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        on QUERY|MUTATION"
      `);
    });
  });

  describe("Document", () => {
    const node: Stringified<AstNodes["Document"]> = {
      kind: "Document",
      comments,
      definitions: [["type MyObjectType{field:Int}"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"type MyObjectType{field:Int}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "type MyObjectType{field:Int}
        #block comment
        #inline comment"
      `);
    });
  });

  describe("EnumTypeDefinition", () => {
    const node: Stringified<AstNodes["EnumTypeDefinition"]> = {
      kind: "EnumTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyEnumType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      valueDefinitionSet: ["{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumTypeExtension", () => {
    const node: Stringified<AstNodes["EnumTypeExtension"]> = {
      kind: "EnumTypeExtension",
      comments,
      name: ["MyEnumType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      valueDefinitionSet: ["{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend enum MyEnumType@myDirective@myOtherDirective{MY_ENUM_VALUE MY_OTHER_ENUM_VALUE}"
      `);
    });
  });

  describe("EnumValue", () => {
    const node: Stringified<AstNodes["EnumValue"]> = {
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
        #inline comment
        MY_ENUM_VALUE"
      `);
    });
  });

  describe("EnumValueDefinitionNode", () => {
    const node: Stringified<AstNodes["EnumValueDefinition"]> = {
      kind: "EnumValueDefinition",
      comments,
      description: ['"my description"'],
      name: ["MY_ENUM_VALUE"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"MY_ENUM_VALUE@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        MY_ENUM_VALUE@myDirective@myOtherDirective"
      `);
    });
  });

  describe("EnumValueDefinitionSetNode", () => {
    const node: Stringified<AstNodes["EnumValueDefinitionSet"]> = {
      kind: "EnumValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [["MY_ENUM_VALUE"], ["MY_OTHER_ENUM_VALUE"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {MY_ENUM_VALUE,MY_OTHER_ENUM_VALUE
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("ExecutableDirectiveLocation", () => {
    const node: Stringified<AstNodes["ExecutableDirectiveLocation"]> = {
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
        #inline comment
        QUERY"
      `);
    });
  });

  describe("Field", () => {
    const node: Stringified<AstNodes["Field"]> = {
      kind: "Field",
      comments,
      alias: ["fieldAlias"],
      name: ["fieldName"],
      argumentSet: ["(argName:42)"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{subField}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"fieldAlias:fieldName(argName:42)@myDirective@myOtherDirective{subField}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        fieldAlias:fieldName(argName:42)@myDirective@myOtherDirective{subField}"
      `);
    });
  });

  describe("FieldDefinition", () => {
    const node: Stringified<AstNodes["FieldDefinition"]> = {
      kind: "FieldDefinition",
      comments,
      description: ['"my description"'],
      name: ["fieldName"],
      inputValueDefinitionSet: ["(argName:MyInputType=42)"],
      type: ["MyOutputType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"fieldName(argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        fieldName(argName:MyInputType=42):MyOutputType@myDirective@myOtherDirective"
      `);
    });
  });

  describe("FieldDefinitionSet", () => {
    const node: Stringified<AstNodes["FieldDefinitionSet"]> = {
      kind: "FieldDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        ["field1:MyOutputType1"],
        ["field2(argName:MyInputType=42):MyOutputType2"],
      ],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {field1:MyOutputType1,field2(argName:MyInputType=42):MyOutputType2
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("FloatValue", () => {
    const node: Stringified<AstNodes["FloatValue"]> = {
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
        #inline comment
        42.43e44"
      `);
    });
  });

  describe("FragmentDefinition", () => {
    const node: Stringified<AstNodes["FragmentDefinition"]> = {
      kind: "FragmentDefinition",
      comments,
      name: ["MyFragmentName"],
      typeCondition: ["MyType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{field}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"fragment MyFragmentName on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        fragment MyFragmentName on MyType@myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("FragmentSpread", () => {
    const node: Stringified<AstNodes["FragmentSpread"]> = {
      kind: "FragmentSpread",
      comments,
      name: ["MyFragmentName"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"...MyFragmentName@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        ...MyFragmentName@myDirective@myOtherDirective"
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
          "#inline comment"
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node])).toMatchInlineSnapshot('""');
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true }))
          .toMatchInlineSnapshot(`
          "#inline comment
          #inline comment"
        `);
      });
    });
  });

  describe("InlineFragment", () => {
    const node: Stringified<AstNodes["InlineFragment"]> = {
      kind: "InlineFragment",
      comments,
      typeCondition: ["MyType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{field}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"...on MyType@myDirective@myOtherDirective{field}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        ...on MyType@myDirective@myOtherDirective{field}"
      `);
    });
  });

  describe("InputObjectTypeDefinition", () => {
    const node: Stringified<AstNodes["InputObjectTypeDefinition"]> = {
      kind: "InputObjectTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyInputObjectType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      inputValueDefinitionSet: ["{field:MyInputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputObjectTypeExtension", () => {
    const node: Stringified<AstNodes["InputObjectTypeExtension"]> = {
      kind: "InputObjectTypeExtension",
      comments,
      name: ["MyInputObjectType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      inputValueDefinitionSet: ["{field:MyInputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend input MyInputObjectType@myDirective@myOtherDirective{field:MyInputType}"
      `);
    });
  });

  describe("InputValueDefinition", () => {
    const node: Stringified<AstNodes["InputValueDefinition"]> = {
      kind: "InputValueDefinition",
      comments,
      description: ['"my description"'],
      name: ["inputField"],
      type: ["MyInputType"],
      defaultValue: ["42"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"inputField:MyInputType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        inputField:MyInputType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("InputValueDefinitionSet", () => {
    const node: Stringified<AstNodes["InputValueDefinitionSet"]> = {
      kind: "InputValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        ["inputField1:MyInputType1"],
        ["inputField2:MyInputType2=42"],
      ],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{inputField1:MyInputType1,inputField2:MyInputType2=42}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {inputField1:MyInputType1,inputField2:MyInputType2=42
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("InterfaceTypeDefinition", () => {
    const node: Stringified<AstNodes["InterfaceTypeDefinition"]> = {
      kind: "InterfaceTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyInterfaceType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{field:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("InterfaceTypeExtension", () => {
    const node: Stringified<AstNodes["InterfaceTypeExtension"]> = {
      kind: "InterfaceTypeExtension",
      comments,
      name: ["MyInterfaceType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{field:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("IntValue", () => {
    const node: Stringified<AstNodes["IntValue"]> = {
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
        #inline comment
        42"
      `);
    });
  });

  describe("ListType", () => {
    const node: Stringified<AstNodes["ListType"]> = {
      kind: "ListType",
      comments,
      type: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"[MyType]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        [MyType]"
      `);
    });
  });

  describe("ListValue", () => {
    const node: Stringified<AstNodes["ListValue"]> = {
      kind: "ListValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      values: [["42"], ["43"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"[42,43]"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        [42,43
        #block comment close
        #inline comment close
        ]"
      `);
    });
  });

  describe("Name", () => {
    const node: Stringified<AstNodes["Name"]> = {
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
    const node: Stringified<AstNodes["NamedType"]> = {
      kind: "NamedType",
      comments,
      name: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"MyType"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        MyType"
      `);
    });
  });

  describe("NamedTypeSet", () => {
    const node: Stringified<AstNodes["NamedTypeSet"]> = {
      kind: "NamedTypeSet",
      comments,
      types: [["MyType1"], ["MyType2"]],
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
        interfaces: node as any,
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
            "type MyObjectType
            #block comment
            #inline comment
            implements MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an object type extension", () => {
      const parent: AstNodes["ObjectTypeExtension"] = {
        kind: "ObjectTypeExtension",
        comments: [],
        name: "MyObjectType" as any,
        interfaces: node as any,
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
            "extend type MyObjectType
            #block comment
            #inline comment
            implements MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type definition", () => {
      const parent: AstNodes["InterfaceTypeDefinition"] = {
        kind: "InterfaceTypeDefinition",
        comments: [],
        description: null,
        name: "MyInterfaceType" as any,
        interfaces: node as any,
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
            "interface MyInterfaceType
            #block comment
            #inline comment
            implements MyType1&MyType2"
          `);
      });
    });
    describe("when printing as child of an interface type extension", () => {
      const parent: AstNodes["InterfaceTypeExtension"] = {
        kind: "InterfaceTypeExtension",
        comments: [],
        name: "MyInterfaceType" as any,
        interfaces: node as any,
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
            "extend interface MyInterfaceType
            #block comment
            #inline comment
            implements MyType1&MyType2"
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
        types: node as any,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "union MyUnionType
            #block comment
            #inline comment
            =MyType1|MyType2"
          `);
      });
    });
    describe("when printing as child of an union type extension", () => {
      const parent: AstNodes["UnionTypeExtension"] = {
        kind: "UnionTypeExtension",
        comments: [],
        name: "MyUnionType" as any,
        directives: [],
        types: node as any,
      };
      it("prints without comments", () => {
        expect(print(parent)).toMatchInlineSnapshot(
          '"extend union MyUnionType=MyType1|MyType2"'
        );
      });
      it("prints with comments", () => {
        expect(print(parent, { preserveComments: true }))
          .toMatchInlineSnapshot(`
            "extend union MyUnionType
            #block comment
            #inline comment
            =MyType1|MyType2"
          `);
      });
    });
  });

  describe("NonNullType", () => {
    const node: Stringified<AstNodes["NonNullType"]> = {
      kind: "NonNullType",
      comments,
      type: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"MyType!"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        MyType!"
      `);
    });
  });

  describe("NullValue", () => {
    const node: Stringified<AstNodes["NullValue"]> = {
      kind: "NullValue",
      comments,
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"null"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        null"
      `);
    });
  });

  describe("ObjectField", () => {
    const node: Stringified<AstNodes["ObjectField"]> = {
      kind: "ObjectField",
      comments,
      name: ["fieldName"],
      value: ["42"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"fieldName:42"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        fieldName:42"
      `);
    });
  });

  describe("ObjectTypeDefinition", () => {
    const node: Stringified<AstNodes["ObjectTypeDefinition"]> = {
      kind: "ObjectTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyObjectType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{field:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectTypeExtension", () => {
    const node: Stringified<AstNodes["ObjectTypeExtension"]> = {
      kind: "ObjectTypeExtension",
      comments,
      name: ["MyObjectType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{field:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(`
        "extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2@myDirective@myOtherDirective{field:MyOutputType}"
      `);
    });
  });

  describe("ObjectValue", () => {
    const node: Stringified<AstNodes["ObjectValue"]> = {
      kind: "ObjectValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      fields: [["fieldName1:42"], ['fieldName2:"some string"']],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{fieldName1:42,fieldName2:\\"some string\\"}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {fieldName1:42,fieldName2:\\"some string\\"
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("OperationDefinition", () => {
    describe("using query shorthand", () => {
      const node: Stringified<AstNodes["OperationDefinition"]> = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: null,
        variableDefinitionSet: null,
        directives: [],
        selectionSet: ["{field1,field2(arg:42)}"],
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
      const node: Stringified<AstNodes["OperationDefinition"]> = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: ["MyOperation"],
        variableDefinitionSet: ["($myVariable:Int=42)"],
        directives: [["@myDirective"], ["@myOtherDirective"]],
        selectionSet: ["{field1,field2(arg:42)}"],
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot(
          '"query MyOperation($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"'
        );
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          #inline comment
          query MyOperation($myVariable:Int=42)@myDirective@myOtherDirective{field1,field2(arg:42)}"
        `);
      });
    });
  });

  describe("OperationTypeDefinition", () => {
    const node: Stringified<AstNodes["OperationTypeDefinition"]> = {
      kind: "OperationTypeDefinition",
      comments,
      operation: "query",
      type: ["MyOutputType"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"query:MyOutputType"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        query:MyOutputType"
      `);
    });
  });

  describe("OperationTypeDefinitionSet", () => {
    const node: Stringified<AstNodes["OperationTypeDefinitionSet"]> = {
      kind: "OperationTypeDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [["query:MyOutputType1"], ["mutation:MyOutputType2"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"{query:MyOutputType1,mutation:MyOutputType2}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {query:MyOutputType1,mutation:MyOutputType2
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("ScalarTypeDefinition", () => {
    const node: Stringified<AstNodes["ScalarTypeDefinition"]> = {
      kind: "ScalarTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyScalarType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        scalar MyScalarType@myDirective@myOtherDirective"
      `);
    });
  });

  describe("ScalarTypeExtension", () => {
    const node: Stringified<AstNodes["ScalarTypeExtension"]> = {
      kind: "ScalarTypeExtension",
      comments,
      name: ["MyScalarType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend scalar MyScalarType@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend scalar MyScalarType@myDirective@myOtherDirective"
      `);
    });
  });

  describe("SchemaDefinition", () => {
    const node: Stringified<AstNodes["SchemaDefinition"]> = {
      kind: "SchemaDefinition",
      comments,
      description: ['"my description"'],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      operationTypeDefinitionSet: ["{query:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        schema@myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SchemaExtension", () => {
    const node: Stringified<AstNodes["SchemaExtension"]> = {
      kind: "SchemaExtension",
      comments,
      directives: [["@myDirective"], ["@myOtherDirective"]],
      operationTypeDefinitionSet: ["{query:MyOutputType}"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend schema@myDirective@myOtherDirective{query:MyOutputType}"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend schema@myDirective@myOtherDirective{query:MyOutputType}"
      `);
    });
  });

  describe("SelectionSet", () => {
    const node: Stringified<AstNodes["SelectionSet"]> = {
      kind: "SelectionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      selections: [["field1"], ["field2(arg:42)"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"{field1,field2(arg:42)}"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        {field1,field2(arg:42)
        #block comment close
        #inline comment close
        }"
      `);
    });
  });

  describe("StringValue", () => {
    describe("regular string values", () => {
      const node: Stringified<AstNodes["StringValue"]> = {
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
          #inline comment
          \\"my string\\""
        `);
      });
    });
    describe("block string values", () => {
      const node: Stringified<AstNodes["StringValue"]> = {
        kind: "StringValue",
        comments,
        block: true,
        value: 'my """ string',
      };
      it("prints without comments", () => {
        expect(print(node)).toMatchInlineSnapshot(`
          "\\"\\"\\"
          my \\\\\\"\\"\\" string
          \\"\\"\\""
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
          "#block comment
          #inline comment
          \\"\\"\\"
          my \\\\\\"\\"\\" string
          \\"\\"\\""
        `);
      });
    });
  });

  describe("TypeSystemDirectiveLocation", () => {
    const node: Stringified<AstNodes["TypeSystemDirectiveLocation"]> = {
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
        #inline comment
        OBJECT"
      `);
    });
  });

  describe("UnionTypeDefinition", () => {
    const node: Stringified<AstNodes["UnionTypeDefinition"]> = {
      kind: "UnionTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyUnionType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      types: ["=MyType1|MyType2"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"\\"my description\\"union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        #block comment
        #inline comment
        union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("UnionTypeExtension", () => {
    const node: Stringified<AstNodes["UnionTypeExtension"]> = {
      kind: "UnionTypeExtension",
      comments,
      name: ["MyUnionType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      types: ["=MyType1|MyType2"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"extend union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        extend union MyUnionType@myDirective@myOtherDirective=MyType1|MyType2"
      `);
    });
  });

  describe("Variable", () => {
    const node: Stringified<AstNodes["Variable"]> = {
      kind: "Variable",
      comments,
      name: ["myVariable"],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot('"$myVariable"');
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        $myVariable"
      `);
    });
  });

  describe("VariableDefinition", () => {
    const node: Stringified<AstNodes["VariableDefinition"]> = {
      kind: "VariableDefinition",
      comments,
      variable: ["$myVariable"],
      type: ["MyType"],
      defaultValue: ["42"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"$myVariable:MyType=42@myDirective@myOtherDirective"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment
        #inline comment
        $myVariable:MyType=42@myDirective@myOtherDirective"
      `);
    });
  });

  describe("VariableDefinitionSet", () => {
    const node: Stringified<AstNodes["VariableDefinitionSet"]> = {
      kind: "VariableDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [["$myVariable:MyType"], ["$myVariable:MyOtherType"]],
    };
    it("prints without comments", () => {
      expect(print(node)).toMatchInlineSnapshot(
        '"($myVariable:MyType,$myVariable:MyOtherType)"'
      );
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true })).toMatchInlineSnapshot(`
        "#block comment open
        #inline comment open
        ($myVariable:MyType,$myVariable:MyOtherType
        #block comment close
        #inline comment close
        )"
      `);
    });
  });
});

describe("pretty printing for ast nodes", () => {
  describe("Argument node", () => {
    const node: Stringified<AstNodes["Argument"]> = {
      kind: "Argument",
      comments,
      name: ["name"],
      value: ['"value"'],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "name: \\"value\\"
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          name: \\"value\\"
          "
        `);
    });
  });

  describe("ArgumentSet", () => {
    describe("inline", () => {
      const node: Stringified<AstNodes["ArgumentSet"]> = {
        kind: "ArgumentSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        args: [['name1: "value1"'], ['name2: "value2"']],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "(name1: \\"value1\\", name2: \\"value2\\")
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            (
              name1: \\"value1\\"
              name2: \\"value2\\"
            # block comment close
            # inline comment close
            )
            "
          `);
      });
    });
    describe("multiline", () => {
      const node: Stringified<AstNodes["ArgumentSet"]> = {
        kind: "ArgumentSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        args: [
          ['name1: "veryveryveryveryveryveryverylongvalue1"'],
          ['name2: "veryveryveryveryveryveryverylongvalue2"'],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "(
            name1: \\"veryveryveryveryveryveryverylongvalue1\\"
            name2: \\"veryveryveryveryveryveryverylongvalue2\\"
          )
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            (
              name1: \\"veryveryveryveryveryveryverylongvalue1\\"
              name2: \\"veryveryveryveryveryveryverylongvalue2\\"
            # block comment close
            # inline comment close
            )
            "
          `);
      });
    });
    describe("with hard line breaks", () => {
      const node: Stringified<AstNodes["ArgumentSet"]> = {
        kind: "ArgumentSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        args: [
          ["name1:", { type: "hard_line" }, '"value1"'],
          ['name2: "value2"'],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "(
            name1:
            \\"value1\\"
            name2: \\"value2\\"
          )
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          (
            name1:
            \\"value1\\"
            name2: \\"value2\\"
          # block comment close
          # inline comment close
          )
          "
        `);
      });
    });
  });

  describe("BlockComment", () => {
    const node: AstNodes["BlockComment"] = {
      kind: "BlockComment",
      value: "block comment",
    };
    describe("single comment", () => {
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
          "# block comment
          "
        `);
      });
    });
    describe("list of comment", () => {
      it("prints without comments", () => {
        expect(print([node, node], { pretty: true })).toMatchInlineSnapshot(`
          "
          "
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # block comment
            "
          `);
      });
    });
  });

  describe("BooleanValue", () => {
    const node: Stringified<AstNodes["BooleanValue"]> = {
      kind: "BooleanValue",
      comments,
      value: true,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "true
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "# block comment
        # inline comment
        true
        "
      `);
    });
  });

  describe("Directive", () => {
    const node: Stringified<AstNodes["Directive"]> = {
      kind: "Directive",
      comments,
      name: ["myDirective"],
      argumentSet: ["(name: value)"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "@myDirective(name: value)
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          @myDirective(name: value)
          "
        `);
    });
  });

  describe("DirectiveDefinition", () => {
    const node: Stringified<AstNodes["DirectiveDefinition"]> = {
      kind: "DirectiveDefinition",
      comments,
      description: ['"my description"'],
      name: ["myDirective"],
      inputValueDefinitionSet: ["(name: Int = 42)"],
      repeatable: true,
      locationSet: ["on QUERY | MUTATION"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        directive @myDirective(name: Int = 42) repeatable on QUERY | MUTATION
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          directive @myDirective(name: Int = 42) repeatable on QUERY | MUTATION
          "
        `);
    });
  });

  describe("DirectiveLocationSet", () => {
    describe("inline", () => {
      const node: Stringified<AstNodes["DirectiveLocationSet"]> = {
        kind: "DirectiveLocationSet",
        comments,
        locations: [["QUERY"], ["MUTATION"]],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "on QUERY | MUTATION
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            on QUERY | MUTATION
            "
          `);
      });
    });
    describe("multiline", () => {
      const node: Stringified<AstNodes["DirectiveLocationSet"]> = {
        kind: "DirectiveLocationSet",
        comments,
        locations: [
          ["QUERY"],
          ["MUTATION"],
          ["SUBSCRIPTION"],
          ["FIELD"],
          ["FRAGMENT_DEFINITION"],
          ["FRAGMENT_SPREAD"],
          ["INLINE_FRAGMENT"],
          ["VARIABLE_DEFINITION"],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "on
          | QUERY
          | MUTATION
          | SUBSCRIPTION
          | FIELD
          | FRAGMENT_DEFINITION
          | FRAGMENT_SPREAD
          | INLINE_FRAGMENT
          | VARIABLE_DEFINITION
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            on
            | QUERY
            | MUTATION
            | SUBSCRIPTION
            | FIELD
            | FRAGMENT_DEFINITION
            | FRAGMENT_SPREAD
            | INLINE_FRAGMENT
            | VARIABLE_DEFINITION
            "
          `);
      });
    });
    describe("with hard line breaks", () => {
      const node: Stringified<AstNodes["DirectiveLocationSet"]> = {
        kind: "DirectiveLocationSet",
        comments,
        locations: [["QUERY"], [{ type: "hard_line" }, "MUTATION"]],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "on
          | QUERY
          | 
          MUTATION
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            on
            | QUERY
            | 
            MUTATION
            "
          `);
      });
    });
  });

  describe("Document", () => {
    const node: Stringified<AstNodes["Document"]> = {
      kind: "Document",
      comments,
      definitions: [["type MyObjectType{\n  field: Int\n}"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "type MyObjectType{
          field: Int
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "type MyObjectType{
            field: Int
          }
          
          # block comment
          # inline comment
          "
        `);
    });
  });

  describe("EnumTypeDefinition", () => {
    const node: Stringified<AstNodes["EnumTypeDefinition"]> = {
      kind: "EnumTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyEnumType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      valueDefinitionSet: ["{\n  MY_ENUM_VALUE\n  MY_OTHER_ENUM_VALUE\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        enum MyEnumType @myDirective @myOtherDirective {
          MY_ENUM_VALUE
          MY_OTHER_ENUM_VALUE
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          enum MyEnumType @myDirective @myOtherDirective {
            MY_ENUM_VALUE
            MY_OTHER_ENUM_VALUE
          }
          "
        `);
    });
  });

  describe("EnumTypeExtension", () => {
    const node: Stringified<AstNodes["EnumTypeExtension"]> = {
      kind: "EnumTypeExtension",
      comments,
      name: ["MyEnumType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      valueDefinitionSet: ["{\n  MY_ENUM_VALUE\n  MY_OTHER_ENUM_VALUE\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend enum MyEnumType @myDirective @myOtherDirective {
          MY_ENUM_VALUE
          MY_OTHER_ENUM_VALUE
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend enum MyEnumType @myDirective @myOtherDirective {
            MY_ENUM_VALUE
            MY_OTHER_ENUM_VALUE
          }
          "
        `);
    });
  });

  describe("EnumValue", () => {
    const node: Stringified<AstNodes["EnumValue"]> = {
      kind: "EnumValue",
      comments,
      value: "MY_ENUM_VALUE",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "MY_ENUM_VALUE
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          MY_ENUM_VALUE
          "
        `);
    });
  });

  describe("EnumValueDefinitionNode", () => {
    const node: Stringified<AstNodes["EnumValueDefinition"]> = {
      kind: "EnumValueDefinition",
      comments,
      description: ['"my description"'],
      name: ["MY_ENUM_VALUE"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        MY_ENUM_VALUE @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          MY_ENUM_VALUE @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("EnumValueDefinitionSetNode", () => {
    const node: Stringified<AstNodes["EnumValueDefinitionSet"]> = {
      kind: "EnumValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [["MY_ENUM_VALUE"], ["MY_OTHER_ENUM_VALUE"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{
          MY_ENUM_VALUE
          MY_OTHER_ENUM_VALUE
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          {
            MY_ENUM_VALUE
            MY_OTHER_ENUM_VALUE
          # block comment close
          # inline comment close
          }
          "
        `);
    });
  });

  describe("ExecutableDirectiveLocation", () => {
    const node: Stringified<AstNodes["ExecutableDirectiveLocation"]> = {
      kind: "ExecutableDirectiveLocation",
      comments,
      value: "QUERY",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "QUERY
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          QUERY
          "
        `);
    });
  });

  describe("Field", () => {
    const node: Stringified<AstNodes["Field"]> = {
      kind: "Field",
      comments,
      alias: ["fieldAlias"],
      name: ["fieldName"],
      argumentSet: ["(argName: 42)"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{\n  subField\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "fieldAlias: fieldName(argName: 42) @myDirective @myOtherDirective {
          subField
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          fieldAlias: fieldName(argName: 42) @myDirective @myOtherDirective {
            subField
          }
          "
        `);
    });
  });

  describe("FieldDefinition", () => {
    const node: Stringified<AstNodes["FieldDefinition"]> = {
      kind: "FieldDefinition",
      comments,
      description: ['"my description"'],
      name: ["fieldName"],
      inputValueDefinitionSet: ["(argName: MyInputType = 42)"],
      type: ["MyOutputType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        fieldName(argName: MyInputType = 42): MyOutputType @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          fieldName(argName: MyInputType = 42): MyOutputType @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("FieldDefinitionSet", () => {
    const node: Stringified<AstNodes["FieldDefinitionSet"]> = {
      kind: "FieldDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        ["field1: MyOutputType1"],
        ["field2(argName: MyInputType = 42): MyOutputType2"],
      ],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{
          field1: MyOutputType1
          field2(argName: MyInputType = 42): MyOutputType2
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          {
            field1: MyOutputType1
            field2(argName: MyInputType = 42): MyOutputType2
          # block comment close
          # inline comment close
          }
          "
        `);
    });
  });

  describe("FloatValue", () => {
    const node: Stringified<AstNodes["FloatValue"]> = {
      kind: "FloatValue",
      comments,
      value: "42.43e44",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "42.43e44
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          42.43e44
          "
        `);
    });
  });

  describe("FragmentDefinition", () => {
    const node: Stringified<AstNodes["FragmentDefinition"]> = {
      kind: "FragmentDefinition",
      comments,
      name: ["MyFragmentName"],
      typeCondition: ["MyType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{\n  field\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "fragment MyFragmentName on MyType @myDirective @myOtherDirective {
          field
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          fragment MyFragmentName on MyType @myDirective @myOtherDirective {
            field
          }
          "
        `);
    });
  });

  describe("FragmentSpread", () => {
    const node: Stringified<AstNodes["FragmentSpread"]> = {
      kind: "FragmentSpread",
      comments,
      name: ["MyFragmentName"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "...MyFragmentName @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          ...MyFragmentName @myDirective @myOtherDirective
          "
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
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "
          "
        `);
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
          "
          "
        `);
      });
      it("prints with comments", () => {
        expect(print([node, node], { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# inline comment
            # inline comment
            "
          `);
      });
    });
  });

  describe("InlineFragment", () => {
    const node: Stringified<AstNodes["InlineFragment"]> = {
      kind: "InlineFragment",
      comments,
      typeCondition: ["MyType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      selectionSet: ["{\n  field\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "...on MyType @myDirective @myOtherDirective {
          field
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          ...on MyType @myDirective @myOtherDirective {
            field
          }
          "
        `);
    });
  });

  describe("InputObjectTypeDefinition", () => {
    const node: Stringified<AstNodes["InputObjectTypeDefinition"]> = {
      kind: "InputObjectTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyInputObjectType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      inputValueDefinitionSet: ["{\n  field: MyInputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        input MyInputObjectType @myDirective @myOtherDirective {
          field: MyInputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          input MyInputObjectType @myDirective @myOtherDirective {
            field: MyInputType
          }
          "
        `);
    });
  });

  describe("InputObjectTypeExtension", () => {
    const node: Stringified<AstNodes["InputObjectTypeExtension"]> = {
      kind: "InputObjectTypeExtension",
      comments,
      name: ["MyInputObjectType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      inputValueDefinitionSet: ["{\n  field: MyInputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend input MyInputObjectType @myDirective @myOtherDirective {
          field: MyInputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend input MyInputObjectType @myDirective @myOtherDirective {
            field: MyInputType
          }
          "
        `);
    });
  });

  describe("InputValueDefinition", () => {
    const node: Stringified<AstNodes["InputValueDefinition"]> = {
      kind: "InputValueDefinition",
      comments,
      description: ['"my description"'],
      name: ["inputField"],
      type: ["MyInputType"],
      defaultValue: ["42"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        inputField: MyInputType = 42 @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          inputField: MyInputType = 42 @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("InputValueDefinitionSet", () => {
    const node: Stringified<AstNodes["InputValueDefinitionSet"]> = {
      kind: "InputValueDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [
        ["inputField1: MyInputType1"],
        ["inputField2: MyInputType2 = 42"],
      ],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{
          inputField1: MyInputType1
          inputField2: MyInputType2 = 42
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          {
            inputField1: MyInputType1
            inputField2: MyInputType2 = 42
          # block comment close
          # inline comment close
          }
          "
        `);
    });
  });

  describe("InterfaceTypeDefinition", () => {
    const node: Stringified<AstNodes["InterfaceTypeDefinition"]> = {
      kind: "InterfaceTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyInterfaceType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{\n  field: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
          field: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
            field: MyOutputType
          }
          "
        `);
    });
  });

  describe("InterfaceTypeExtension", () => {
    const node: Stringified<AstNodes["InterfaceTypeExtension"]> = {
      kind: "InterfaceTypeExtension",
      comments,
      name: ["MyInterfaceType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{\n  field: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
          field: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend interface MyInterfaceType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
            field: MyOutputType
          }
          "
        `);
    });
  });

  describe("IntValue", () => {
    const node: Stringified<AstNodes["IntValue"]> = {
      kind: "IntValue",
      comments,
      value: "42",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "42
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          42
          "
        `);
    });
  });

  describe("ListType", () => {
    const node: Stringified<AstNodes["ListType"]> = {
      kind: "ListType",
      comments,
      type: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "[MyType]
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          [MyType]
          "
        `);
    });
  });

  describe("ListValue", () => {
    const node: Stringified<AstNodes["ListValue"]> = {
      kind: "ListValue",
      commentsOpeningBracket,
      commentsClosingBracket,
      values: [["42"], ["43"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "[42, 43]
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          [
            42
            43
          # block comment close
          # inline comment close
          ]
          "
        `);
    });
  });

  describe("Name", () => {
    const node: Stringified<AstNodes["Name"]> = {
      kind: "Name",
      value: "myName",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "myName
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "myName
          "
        `);
    });
  });

  describe("NamedType", () => {
    const node: Stringified<AstNodes["NamedType"]> = {
      kind: "NamedType",
      comments,
      name: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "MyType
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          MyType
          "
        `);
    });
  });

  describe("NamedTypeSet", () => {
    describe("inline", () => {
      const node: Stringified<AstNodes["NamedTypeSet"]> = {
        kind: "NamedTypeSet",
        comments,
        types: [["MyType1"], ["MyType2"]],
      };
      describe("when printing standalone", () => {
        it("prints without comments", () => {
          expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
            "MyType1, MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(node, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "# block comment
              # inline comment
              MyType1, MyType2
              "
            `);
        });
      });
      describe("when printing as child of an object type definition", () => {
        const parent: AstNodes["ObjectTypeDefinition"] = {
          kind: "ObjectTypeDefinition",
          comments: [],
          description: null,
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "type MyObjectType implements MyType1 & MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "type MyObjectType
              # block comment
              # inline comment
              implements MyType1 & MyType2
              "
            `);
        });
      });
      describe("when printing as child of an object type extension", () => {
        const parent: AstNodes["ObjectTypeExtension"] = {
          kind: "ObjectTypeExtension",
          comments: [],
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend type MyObjectType implements MyType1 & MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend type MyObjectType
              # block comment
              # inline comment
              implements MyType1 & MyType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type definition", () => {
        const parent: AstNodes["InterfaceTypeDefinition"] = {
          kind: "InterfaceTypeDefinition",
          comments: [],
          description: null,
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "interface MyInterfaceType implements MyType1 & MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "interface MyInterfaceType
              # block comment
              # inline comment
              implements MyType1 & MyType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type extension", () => {
        const parent: AstNodes["InterfaceTypeExtension"] = {
          kind: "InterfaceTypeExtension",
          comments: [],
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend interface MyInterfaceType implements MyType1 & MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend interface MyInterfaceType
              # block comment
              # inline comment
              implements MyType1 & MyType2
              "
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
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "union MyUnionType = MyType1 | MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "union MyUnionType
              # block comment
              # inline comment
              = MyType1 | MyType2
              "
            `);
        });
      });
      describe("when printing as child of an union type extension", () => {
        const parent: AstNodes["UnionTypeExtension"] = {
          kind: "UnionTypeExtension",
          comments: [],
          name: "MyUnionType" as any,
          directives: [],
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend union MyUnionType = MyType1 | MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend union MyUnionType
              # block comment
              # inline comment
              = MyType1 | MyType2
              "
            `);
        });
      });
    });
    describe("multiline", () => {
      const node: Stringified<AstNodes["NamedTypeSet"]> = {
        kind: "NamedTypeSet",
        comments,
        types: [
          ["MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1"],
          ["MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2"],
        ],
      };
      describe("when printing standalone", () => {
        it("prints without comments", () => {
          expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
            "MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(node, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "# block comment
              # inline comment
              MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
      describe("when printing as child of an object type definition", () => {
        const parent: AstNodes["ObjectTypeDefinition"] = {
          kind: "ObjectTypeDefinition",
          comments: [],
          description: null,
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "type MyObjectType implements
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "type MyObjectType
              # block comment
              # inline comment
              implements
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
      describe("when printing as child of an object type extension", () => {
        const parent: AstNodes["ObjectTypeExtension"] = {
          kind: "ObjectTypeExtension",
          comments: [],
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend type MyObjectType implements
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend type MyObjectType
              # block comment
              # inline comment
              implements
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type definition", () => {
        const parent: AstNodes["InterfaceTypeDefinition"] = {
          kind: "InterfaceTypeDefinition",
          comments: [],
          description: null,
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "interface MyInterfaceType implements
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "interface MyInterfaceType
              # block comment
              # inline comment
              implements
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type extension", () => {
        const parent: AstNodes["InterfaceTypeExtension"] = {
          kind: "InterfaceTypeExtension",
          comments: [],
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend interface MyInterfaceType implements
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend interface MyInterfaceType
              # block comment
              # inline comment
              implements
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              & MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
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
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "union MyUnionType =
            | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "union MyUnionType
              # block comment
              # inline comment
              =
              | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
      describe("when printing as child of an union type extension", () => {
        const parent: AstNodes["UnionTypeExtension"] = {
          kind: "UnionTypeExtension",
          comments: [],
          name: "MyUnionType" as any,
          directives: [],
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend union MyUnionType =
            | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
            | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend union MyUnionType
              # block comment
              # inline comment
              =
              | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType1
              | MyVeryVeryVeryVeryVeryVeryVeryVeryLongType2
              "
            `);
        });
      });
    });
    describe("with hard line breaks", () => {
      const node: Stringified<AstNodes["NamedTypeSet"]> = {
        kind: "NamedTypeSet",
        comments,
        types: [["MyType1"], [{ type: "hard_line" }, "MyType2"]],
      };
      describe("when printing standalone", () => {
        it("prints without comments", () => {
          expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
            "MyType1
            
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(node, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "# block comment
              # inline comment
              MyType1
              
              MyType2
              "
            `);
        });
      });
      describe("when printing as child of an object type definition", () => {
        const parent: AstNodes["ObjectTypeDefinition"] = {
          kind: "ObjectTypeDefinition",
          comments: [],
          description: null,
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "type MyObjectType implements
            & MyType1
            & 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "type MyObjectType
              # block comment
              # inline comment
              implements
              & MyType1
              & 
              MyType2
              "
            `);
        });
      });
      describe("when printing as child of an object type extension", () => {
        const parent: AstNodes["ObjectTypeExtension"] = {
          kind: "ObjectTypeExtension",
          comments: [],
          name: "MyObjectType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend type MyObjectType implements
            & MyType1
            & 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend type MyObjectType
              # block comment
              # inline comment
              implements
              & MyType1
              & 
              MyType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type definition", () => {
        const parent: AstNodes["InterfaceTypeDefinition"] = {
          kind: "InterfaceTypeDefinition",
          comments: [],
          description: null,
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "interface MyInterfaceType implements
            & MyType1
            & 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "interface MyInterfaceType
              # block comment
              # inline comment
              implements
              & MyType1
              & 
              MyType2
              "
            `);
        });
      });
      describe("when printing as child of an interface type extension", () => {
        const parent: AstNodes["InterfaceTypeExtension"] = {
          kind: "InterfaceTypeExtension",
          comments: [],
          name: "MyInterfaceType" as any,
          interfaces: node as any,
          directives: [],
          fieldDefinitionSet: null,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend interface MyInterfaceType implements
            & MyType1
            & 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend interface MyInterfaceType
              # block comment
              # inline comment
              implements
              & MyType1
              & 
              MyType2
              "
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
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "union MyUnionType =
            | MyType1
            | 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "union MyUnionType
              # block comment
              # inline comment
              =
              | MyType1
              | 
              MyType2
              "
            `);
        });
      });
      describe("when printing as child of an union type extension", () => {
        const parent: AstNodes["UnionTypeExtension"] = {
          kind: "UnionTypeExtension",
          comments: [],
          name: "MyUnionType" as any,
          directives: [],
          types: node as any,
        };
        it("prints without comments", () => {
          expect(print(parent, { pretty: true })).toMatchInlineSnapshot(`
            "extend union MyUnionType =
            | MyType1
            | 
            MyType2
            "
          `);
        });
        it("prints with comments", () => {
          expect(print(parent, { preserveComments: true, pretty: true }))
            .toMatchInlineSnapshot(`
              "extend union MyUnionType
              # block comment
              # inline comment
              =
              | MyType1
              | 
              MyType2
              "
            `);
        });
      });
    });
  });

  describe("NonNullType", () => {
    const node: Stringified<AstNodes["NonNullType"]> = {
      kind: "NonNullType",
      comments,
      type: ["MyType"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "MyType!
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          MyType!
          "
        `);
    });
  });

  describe("NullValue", () => {
    const node: Stringified<AstNodes["NullValue"]> = {
      kind: "NullValue",
      comments,
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "null
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          null
          "
        `);
    });
  });

  describe("ObjectField", () => {
    const node: Stringified<AstNodes["ObjectField"]> = {
      kind: "ObjectField",
      comments,
      name: ["fieldName"],
      value: ["42"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "fieldName: 42
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          fieldName: 42
          "
        `);
    });
  });

  describe("ObjectTypeDefinition", () => {
    const node: Stringified<AstNodes["ObjectTypeDefinition"]> = {
      kind: "ObjectTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyObjectType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{\n  field: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        type MyObjectType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
          field: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          type MyObjectType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
            field: MyOutputType
          }
          "
        `);
    });
  });

  describe("ObjectTypeExtension", () => {
    const node: Stringified<AstNodes["ObjectTypeExtension"]> = {
      kind: "ObjectTypeExtension",
      comments,
      name: ["MyObjectType"],
      interfaces: [" implements MyInterfaceType1 & MyInterfaceType2"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      fieldDefinitionSet: ["{\n  field: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
          field: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend type MyObjectType implements MyInterfaceType1 & MyInterfaceType2 @myDirective @myOtherDirective {
            field: MyOutputType
          }
          "
        `);
    });
  });

  describe("ObjectValue", () => {
    describe("inline", () => {
      const node: Stringified<AstNodes["ObjectValue"]> = {
        kind: "ObjectValue",
        commentsOpeningBracket,
        commentsClosingBracket,
        fields: [["fieldName1: 42"], ['fieldName2: "some string"']],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "{ fieldName1: 42, fieldName2: \\"some string\\" }
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            {
              fieldName1: 42
              fieldName2: \\"some string\\"
            # block comment close
            # inline comment close
            }
            "
          `);
      });
    });
    describe("multiline", () => {
      const node: Stringified<AstNodes["ObjectValue"]> = {
        kind: "ObjectValue",
        commentsOpeningBracket,
        commentsClosingBracket,
        fields: [
          ["fieldName1: 4242424242424242424242424242424242424242"],
          ['fieldName2: "some very very very very long string"'],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "{
            fieldName1: 4242424242424242424242424242424242424242
            fieldName2: \\"some very very very very long string\\"
          }
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            {
              fieldName1: 4242424242424242424242424242424242424242
              fieldName2: \\"some very very very very long string\\"
            # block comment close
            # inline comment close
            }
            "
          `);
      });
    });
    describe("with hard line breaks", () => {
      const node: Stringified<AstNodes["ObjectValue"]> = {
        kind: "ObjectValue",
        commentsOpeningBracket,
        commentsClosingBracket,
        fields: [
          ["fieldName1:", { type: "hard_line" }, "42"],
          ['fieldName2: "some string"'],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "{
            fieldName1:
            42
            fieldName2: \\"some string\\"
          }
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            {
              fieldName1:
              42
              fieldName2: \\"some string\\"
            # block comment close
            # inline comment close
            }
            "
          `);
      });
    });
  });

  describe("OperationDefinition", () => {
    describe("using query shorthand", () => {
      const node: Stringified<AstNodes["OperationDefinition"]> = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: null,
        variableDefinitionSet: null,
        directives: [],
        selectionSet: ["{\n  field1\n  field2(arg: 42)\n}"],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "{
            field1
            field2(arg: 42)
          }
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "{
              field1
              field2(arg: 42)
            }
            "
          `);
      });
    });
    describe("using elaborate form", () => {
      const node: Stringified<AstNodes["OperationDefinition"]> = {
        kind: "OperationDefinition",
        comments,
        operation: "query",
        name: ["MyOperation"],
        variableDefinitionSet: ["($myVariable: Int = 42)"],
        directives: [["@myDirective"], ["@myOtherDirective"]],
        selectionSet: ["{\n  field1\n  field2(arg: 42)\n}"],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "query MyOperation($myVariable: Int = 42) @myDirective @myOtherDirective {
            field1
            field2(arg: 42)
          }
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            query MyOperation($myVariable: Int = 42) @myDirective @myOtherDirective {
              field1
              field2(arg: 42)
            }
            "
          `);
      });
    });
  });

  describe("OperationTypeDefinition", () => {
    const node: Stringified<AstNodes["OperationTypeDefinition"]> = {
      kind: "OperationTypeDefinition",
      comments,
      operation: "query",
      type: ["MyOutputType"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "query: MyOutputType
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          query: MyOutputType
          "
        `);
    });
  });

  describe("OperationTypeDefinitionSet", () => {
    const node: Stringified<AstNodes["OperationTypeDefinitionSet"]> = {
      kind: "OperationTypeDefinitionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      definitions: [["query: MyOutputType1"], ["mutation: MyOutputType2"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{
          query: MyOutputType1
          mutation: MyOutputType2
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          {
            query: MyOutputType1
            mutation: MyOutputType2
          # block comment close
          # inline comment close
          }
          "
        `);
    });
  });

  describe("ScalarTypeDefinition", () => {
    const node: Stringified<AstNodes["ScalarTypeDefinition"]> = {
      kind: "ScalarTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyScalarType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        scalar MyScalarType @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          scalar MyScalarType @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("ScalarTypeExtension", () => {
    const node: Stringified<AstNodes["ScalarTypeExtension"]> = {
      kind: "ScalarTypeExtension",
      comments,
      name: ["MyScalarType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend scalar MyScalarType @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend scalar MyScalarType @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("SchemaDefinition", () => {
    const node: Stringified<AstNodes["SchemaDefinition"]> = {
      kind: "SchemaDefinition",
      comments,
      description: ['"my description"'],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      operationTypeDefinitionSet: ["{\n  query: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        schema @myDirective @myOtherDirective {
          query: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          schema @myDirective @myOtherDirective {
            query: MyOutputType
          }
          "
        `);
    });
  });

  describe("SchemaExtension", () => {
    const node: Stringified<AstNodes["SchemaExtension"]> = {
      kind: "SchemaExtension",
      comments,
      directives: [["@myDirective"], ["@myOtherDirective"]],
      operationTypeDefinitionSet: ["{\n  query: MyOutputType\n}"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend schema @myDirective @myOtherDirective {
          query: MyOutputType
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend schema @myDirective @myOtherDirective {
            query: MyOutputType
          }
          "
        `);
    });
  });

  describe("SelectionSet", () => {
    const node: Stringified<AstNodes["SelectionSet"]> = {
      kind: "SelectionSet",
      commentsOpeningBracket,
      commentsClosingBracket,
      selections: [["field1"], ["field2(arg: 42)"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "{
          field1
          field2(arg: 42)
        }
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment open
          # inline comment open
          {
            field1
            field2(arg: 42)
          # block comment close
          # inline comment close
          }
          "
        `);
    });
  });

  describe("StringValue", () => {
    describe("regular string values", () => {
      const node: Stringified<AstNodes["StringValue"]> = {
        kind: "StringValue",
        comments,
        block: false,
        value: "my string",
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "\\"my string\\"
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            \\"my string\\"
            "
          `);
      });
    });
    describe("block string values", () => {
      const node: Stringified<AstNodes["StringValue"]> = {
        kind: "StringValue",
        comments,
        block: true,
        value: 'my """ string',
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "\\"\\"\\"
          my \\\\\\"\\"\\" string
          \\"\\"\\"
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment
            # inline comment
            \\"\\"\\"
            my \\\\\\"\\"\\" string
            \\"\\"\\"
            "
          `);
      });
    });
  });

  describe("TypeSystemDirectiveLocation", () => {
    const node: Stringified<AstNodes["TypeSystemDirectiveLocation"]> = {
      kind: "TypeSystemDirectiveLocation",
      comments,
      value: "OBJECT",
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "OBJECT
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
        "# block comment
        # inline comment
        OBJECT
        "
      `);
    });
  });

  describe("UnionTypeDefinition", () => {
    const node: Stringified<AstNodes["UnionTypeDefinition"]> = {
      kind: "UnionTypeDefinition",
      comments,
      description: ['"my description"'],
      name: ["MyUnionType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      types: [" = MyType1 | MyType2"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "\\"my description\\"
        union MyUnionType @myDirective @myOtherDirective = MyType1 | MyType2
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "\\"my description\\"
          # block comment
          # inline comment
          union MyUnionType @myDirective @myOtherDirective = MyType1 | MyType2
          "
        `);
    });
  });

  describe("UnionTypeExtension", () => {
    const node: Stringified<AstNodes["UnionTypeExtension"]> = {
      kind: "UnionTypeExtension",
      comments,
      name: ["MyUnionType"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
      types: [" = MyType1 | MyType2"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "extend union MyUnionType @myDirective @myOtherDirective = MyType1 | MyType2
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          extend union MyUnionType @myDirective @myOtherDirective = MyType1 | MyType2
          "
        `);
    });
  });

  describe("Variable", () => {
    const node: Stringified<AstNodes["Variable"]> = {
      kind: "Variable",
      comments,
      name: ["myVariable"],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "$myVariable
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          $myVariable
          "
        `);
    });
  });

  describe("VariableDefinition", () => {
    const node: Stringified<AstNodes["VariableDefinition"]> = {
      kind: "VariableDefinition",
      comments,
      variable: ["$myVariable"],
      type: ["MyType"],
      defaultValue: ["42"],
      directives: [["@myDirective"], ["@myOtherDirective"]],
    };
    it("prints without comments", () => {
      expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
        "$myVariable: MyType = 42 @myDirective @myOtherDirective
        "
      `);
    });
    it("prints with comments", () => {
      expect(print(node, { preserveComments: true, pretty: true }))
        .toMatchInlineSnapshot(`
          "# block comment
          # inline comment
          $myVariable: MyType = 42 @myDirective @myOtherDirective
          "
        `);
    });
  });

  describe("VariableDefinitionSet", () => {
    describe("inline", () => {
      const node: Stringified<AstNodes["VariableDefinitionSet"]> = {
        kind: "VariableDefinitionSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        definitions: [["$myVariable: MyType"], ["$myVariable: MyOtherType"]],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "($myVariable: MyType, $myVariable: MyOtherType)
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            (
              $myVariable: MyType
              $myVariable: MyOtherType
            # block comment close
            # inline comment close
            )
            "
          `);
      });
    });
    describe("multiline", () => {
      const node: Stringified<AstNodes["VariableDefinitionSet"]> = {
        kind: "VariableDefinitionSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        definitions: [
          ["$myVariable: MyVeryVeryVeryVeryLongType"],
          ["$myVariable: MyOtherVeryVeryVeryVeryLongType"],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "(
            $myVariable: MyVeryVeryVeryVeryLongType
            $myVariable: MyOtherVeryVeryVeryVeryLongType
          )
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            (
              $myVariable: MyVeryVeryVeryVeryLongType
              $myVariable: MyOtherVeryVeryVeryVeryLongType
            # block comment close
            # inline comment close
            )
            "
          `);
      });
    });
    describe("with hard line breaks", () => {
      const node: Stringified<AstNodes["VariableDefinitionSet"]> = {
        kind: "VariableDefinitionSet",
        commentsOpeningBracket,
        commentsClosingBracket,
        definitions: [
          ["$myVariable:", { type: "hard_line" }, "MyType"],
          ["$myVariable: MyOtherType"],
        ],
      };
      it("prints without comments", () => {
        expect(print(node, { pretty: true })).toMatchInlineSnapshot(`
          "(
            $myVariable:
            MyType
            $myVariable: MyOtherType
          )
          "
        `);
      });
      it("prints with comments", () => {
        expect(print(node, { preserveComments: true, pretty: true }))
          .toMatchInlineSnapshot(`
            "# block comment open
            # inline comment open
            (
              $myVariable:
              MyType
              $myVariable: MyOtherType
            # block comment close
            # inline comment close
            )
            "
          `);
      });
    });
  });
});

describe.skip("max line length", () => {
  function generateAst(args: AstNodes["Argument"][]): AstNodes["Document"] {
    return {
      kind: "Document",
      comments: [],
      definitions: [
        {
          kind: "OperationDefinition",
          comments: [],
          operation: "query",
          name: { kind: "Name", value: "MyQuery" },
          variableDefinitionSet: null,
          directives: [],
          selectionSet: {
            kind: "SelectionSet",
            commentsOpeningBracket: [],
            commentsClosingBracket: [],
            selections: [
              {
                kind: "Field",
                comments: [],
                alias: null,
                name: { kind: "Name", value: "exampleField" },
                argumentSet: {
                  kind: "ArgumentSet",
                  commentsOpeningBracket: [],
                  commentsClosingBracket: [],
                  args,
                },
                directives: [],
                selectionSet: null,
              },
            ],
          },
        },
      ],
    };
  }

  function generateArg(name: string, value: string): AstNodes["Argument"] {
    return {
      kind: "Argument",
      comments: [],
      name: { kind: "Name", value: "argName" },
      value: {
        kind: "StringValue",
        comments: [],
        block: false,
        value: "arg value",
      },
    };
  }

  it("prints a short lists inline", () => {
    const ast = generateAst([
      generateArg("argName1", "arg value 1"),
      generateArg("argName2", "arg value 2"),
    ]);
    expect(print(ast, { pretty: true })).toMatchInlineSnapshot(`
      "query MyQuery{
        exampleField(argName: \\"arg value\\", argName: \\"arg value\\")
      }
      "
    `);
  });

  it("prints a long lists inline", () => {
    const ast = generateAst([
      generateArg("argName1", "arg value 1"),
      generateArg("argName2", "arg value 2"),
      generateArg("argName3", "arg value 3"),
      generateArg("argName4", "arg value 4"),
    ]);
    expect(print(ast, { pretty: true })).toMatchInlineSnapshot(`
      "query MyQuery{
        exampleField(
          argName: \\"arg value\\"
          argName: \\"arg value\\"
          argName: \\"arg value\\"
          argName: \\"arg value\\"
        )
      }
      "
    `);
  });
});
