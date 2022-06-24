import type {
  AstNode,
  CommentNode,
  DirectiveConstNode,
  DirectiveNode,
  NamedTypeNode,
  StringValueNode,
  ValueConstNode,
} from "@graphql-modular/language";
import { traverse } from "@graphql-modular/traverse";

export function print(
  ast: AstNode | AstNode[],
  {
    indentationStep = "  ",
    // maxLineLength = 80,
    preserveComments = false,
    pretty = false,
  }: {
    indentationStep?: string;
    maxLineLength?: number;
    preserveComments?: boolean;
    pretty?: boolean;
  } = {}
): string {
  const SPACE = pretty ? " " : "";
  const LINE_BREAK = pretty ? "\n" : "";

  let lead = "";

  function indent() {
    if (pretty) lead += indentationStep;
  }

  function dedent() {
    if (pretty) lead = lead.substring(indentationStep.length);
  }

  function printComment(comment: CommentNode) {
    return preserveComments
      ? (comment.kind === "BlockComment" ? LINE_BREAK : "") +
          comment.value
            .split("\n")
            .map((line) => lead + "#" + SPACE + line)
            .join("\n") +
          "\n"
      : "";
  }

  function printComments(comments: CommentNode[]) {
    const printedComments = { before: "", after: "" };
    for (const comment of comments) {
      printedComments[comment.kind === "BlockComment" ? "before" : "after"] +=
        printComment(comment);
    }
    return printedComments;
  }

  function printNodeWithComments(
    printed: string,
    comments: CommentNode[],
    description?: StringValueNode | null
  ) {
    const { before, after } = printComments(comments);
    return (
      (description ? lead + description : "") +
      (description && !before ? LINE_BREAK : "") +
      before +
      (before ? lead : "") +
      printed +
      (after ? SPACE : "") +
      after
    );
  }

  function printWrappedListWithComments(
    list: any[],
    openingBracketPunctuator: string,
    closingBracketPunctuator: string,
    commentsOpeningBracket: CommentNode[],
    commentsClosingBracket: CommentNode[]
  ) {
    dedent();

    const openingBracket = printComments(commentsOpeningBracket);
    const closingBracket = printComments(commentsClosingBracket);

    return (
      openingBracket.before +
      (openingBracket.before ? lead : "") +
      openingBracketPunctuator +
      (openingBracket.after ? SPACE : "") +
      openingBracket.after +
      (openingBracket.after ? "" : LINE_BREAK) +
      list.join(pretty ? LINE_BREAK : ",") +
      closingBracket.before +
      (closingBracket.before ? "" : LINE_BREAK) +
      lead +
      closingBracketPunctuator +
      (closingBracket.after ? SPACE : "") +
      closingBracket.after
    );
  }

  function printDirectives(directives: DirectiveNode[] | DirectiveConstNode[]) {
    return directives.join("");
  }

  function printDefaultValue(value: ValueConstNode | null) {
    return value ? "=" + value : "";
  }

  function printTypeCondition(value: NamedTypeNode | null) {
    return value ? "on " + value : "";
  }

  return traverse(ast, {
    Argument: {
      leave(node) {
        return (
          lead +
          printNodeWithComments(
            node.name + ":" + SPACE + node.value,
            node.comments
          )
        );
      },
    },
    ArgumentSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.args,
          "(",
          ")",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    BlockComment: {
      leave(node, _key, _parent, path) {
        return path.length > 1 ? node : printComment(node);
      },
    },
    BooleanValue: {
      leave(node) {
        return printNodeWithComments("" + node.value, node.comments);
      },
    },
    Directive: {
      leave(node) {
        return (
          printNodeWithComments("@" + node.name, node.comments) +
          (node.argumentSet || "")
        );
      },
    },
    DirectiveDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            "directive" + SPACE + "@" + node.name,
            node.comments,
            node.description
          ) +
          (node.inputValueDefinitionSet || "") +
          (node.repeatable ? " repeatable " : " ") +
          node.locationSet
        );
      },
    },
    DirectiveLocationSet: {
      leave(node) {
        let printed = printNodeWithComments("on", node.comments);
        if (!printed.endsWith("\n")) printed += " ";
        return printed + node.locations.join("|");
      },
    },
    Document: {
      leave(node) {
        const definitions = node.definitions.join("\n");
        const { before, after } = printComments(node.comments);
        return definitions + "\n" + before + after;
      },
    },
    EnumTypeDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            "enum " + node.name,
            node.comments,
            node.description
          ) +
          printDirectives(node.directives) +
          (node.valueDefinitionSet || "")
        );
      },
    },
    EnumTypeExtension: {
      leave(node) {
        return (
          printNodeWithComments("extend enum " + node.name, node.comments) +
          printDirectives(node.directives) +
          (node.valueDefinitionSet || "")
        );
      },
    },
    EnumValue: {
      leave(node) {
        return printNodeWithComments(node.value, node.comments);
      },
    },
    EnumValueDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            lead + node.name,
            node.comments,
            node.description
          ) + printDirectives(node.directives)
        );
      },
    },
    EnumValueDefinitionSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.definitions,
          "{",
          "}",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    ExecutableDirectiveLocation: {
      leave(node) {
        return printNodeWithComments(node.value, node.comments);
      },
    },
    Field: {
      leave(node) {
        return (
          printNodeWithComments(
            lead + (node.alias ? node.alias + ":" : "") + node.name,
            node.comments
          ) +
          (node.argumentSet || "") +
          printDirectives(node.directives) +
          (node.selectionSet || "")
        );
      },
    },
    FieldDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            lead + node.name,
            node.comments,
            node.description
          ) +
          (node.inputValueDefinitionSet || "") +
          ":" +
          node.type +
          printDirectives(node.directives)
        );
      },
    },
    FieldDefinitionSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.definitions,
          "{",
          "}",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    FloatValue: {
      leave(node) {
        return printNodeWithComments(node.value, node.comments);
      },
    },
    FragmentDefinition: {
      leave(node) {
        let printed = printNodeWithComments(
          "fragment " + node.name,
          node.comments
        );
        if (node.typeCondition && !printed.endsWith("\n")) printed += " ";
        return (
          printed +
          printTypeCondition(node.typeCondition) +
          printDirectives(node.directives) +
          node.selectionSet
        );
      },
    },
    FragmentSpread: {
      leave(node) {
        return (
          printNodeWithComments(lead + "..." + node.name, node.comments) +
          printDirectives(node.directives)
        );
      },
    },
    InlineComment: {
      leave(node, _key, _parent, path) {
        return path.length > 1 ? node : printComment(node);
      },
    },
    InlineFragment: {
      leave(node) {
        return (
          printNodeWithComments(
            lead + "..." + printTypeCondition(node.typeCondition),
            node.comments
          ) +
          printDirectives(node.directives) +
          node.selectionSet
        );
      },
    },
    InputObjectTypeDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            "input " + node.name,
            node.comments,
            node.description
          ) +
          printDirectives(node.directives) +
          (node.inputValueDefinitionSet || "")
        );
      },
    },
    InputObjectTypeExtension: {
      leave(node) {
        return (
          printNodeWithComments("extend input " + node.name, node.comments) +
          printDirectives(node.directives) +
          (node.inputValueDefinitionSet || "")
        );
      },
    },
    InputValueDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            lead + node.name + ":",
            node.comments,
            node.description
          ) +
          node.type +
          printDefaultValue(node.defaultValue) +
          printDirectives(node.directives)
        );
      },
    },
    InputValueDefinitionSet: {
      enter() {
        indent();
      },
      leave(node, _key, parent) {
        const [startPunctuator, endPunctuator] =
          isSingleNode(parent) &&
          (parent.kind === "DirectiveDefinition" ||
            parent.kind === "FieldDefinition")
            ? ["(", ")"]
            : ["{", "}"];
        return printWrappedListWithComments(
          node.definitions,
          startPunctuator,
          endPunctuator,
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    IntValue: {
      leave(node) {
        return printNodeWithComments(node.value, node.comments);
      },
    },
    InterfaceTypeDefinition: {
      leave(node) {
        let printed = printNodeWithComments(
          "interface " + node.name,
          node.comments,
          node.description
        );
        if (node.interfaces && !printed.endsWith("\n")) printed += " ";
        return (
          printed +
          (node.interfaces || "") +
          printDirectives(node.directives) +
          (node.fieldDefinitionSet || "")
        );
      },
    },
    InterfaceTypeExtension: {
      leave(node) {
        let printed = printNodeWithComments(
          "extend interface " + node.name,
          node.comments
        );
        if (node.interfaces && !printed.endsWith("\n")) printed += " ";
        return (
          printed +
          (node.interfaces || "") +
          printDirectives(node.directives) +
          (node.fieldDefinitionSet || "")
        );
      },
    },
    ListType: {
      leave(node) {
        return printNodeWithComments("[" + node.type + "]", node.comments);
      },
    },
    ListValue: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.values.map((value) => lead + value),
          "[",
          "]",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    Name: {
      leave(node) {
        return node.value;
      },
    },
    NamedType: {
      leave(node) {
        return printNodeWithComments("" + node.name, node.comments);
      },
    },
    NamedTypeSet: {
      leave(node, _key, parent) {
        const [initializer = "", spacer = "", delimiter = ","] = isSingleNode(
          parent
        )
          ? parent.kind === "ObjectTypeDefinition" ||
            parent.kind === "ObjectTypeExtension" ||
            parent.kind === "InterfaceTypeDefinition" ||
            parent.kind === "InterfaceTypeExtension"
            ? ["implements", " ", "&"]
            : parent.kind === "UnionTypeDefinition" ||
              parent.kind === "UnionTypeExtension"
            ? ["=", "", "|"]
            : []
          : [];
        const { before, after } = printComments(node.comments);
        const afterWithSpacer = after ? after + "" : after + spacer;
        const types = node.types.join(delimiter);
        if (!initializer) return before + afterWithSpacer + types;
        return (
          before + initializer + (after ? SPACE : "") + afterWithSpacer + types
        );
      },
    },
    NonNullType: {
      leave(node) {
        return printNodeWithComments(node.type + "!", node.comments);
      },
    },
    NullValue: {
      leave(node) {
        return printNodeWithComments("null", node.comments);
      },
    },
    ObjectField: {
      leave(node) {
        return printNodeWithComments(
          node.name + ":" + node.value,
          node.comments
        );
      },
    },
    ObjectTypeDefinition: {
      leave(node) {
        let printed = printNodeWithComments(
          "type " + node.name,
          node.comments,
          node.description
        );
        if (node.interfaces && !printed.endsWith("\n")) printed += " ";
        return (
          printed +
          (node.interfaces || "") +
          printDirectives(node.directives) +
          (node.fieldDefinitionSet || "")
        );
      },
    },
    ObjectTypeExtension: {
      leave(node) {
        let printed = printNodeWithComments(
          "extend type " + node.name,
          node.comments
        );
        if (node.interfaces && !printed.endsWith("\n")) printed += " ";
        return (
          printed +
          (node.interfaces || "") +
          printDirectives(node.directives) +
          (node.fieldDefinitionSet || "")
        );
      },
    },
    ObjectValue: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.fields.map((field) => lead + field),
          "{",
          "}",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    OperationDefinition: {
      leave(node) {
        if (
          !node.name &&
          !node.variableDefinitionSet &&
          node.directives.length === 0
        )
          return node.selectionSet;
        return (
          printNodeWithComments(
            node.operation + (node.name ? " " + node.name : ""),
            node.comments
          ) +
          (node.variableDefinitionSet || "") +
          printDirectives(node.directives) +
          node.selectionSet
        );
      },
    },
    OperationTypeDefinition: {
      leave(node) {
        return (
          lead +
          printNodeWithComments(node.operation + ":", node.comments) +
          node.type
        );
      },
    },
    OperationTypeDefinitionSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.definitions,
          "{",
          "}",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    ScalarTypeDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            "scalar " + node.name,
            node.comments,
            node.description
          ) + printDirectives(node.directives)
        );
      },
    },
    ScalarTypeExtension: {
      leave(node) {
        return (
          printNodeWithComments("extend scalar " + node.name, node.comments) +
          printDirectives(node.directives)
        );
      },
    },
    SchemaDefinition: {
      leave(node) {
        return (
          printNodeWithComments("schema", node.comments, node.description) +
          printDirectives(node.directives) +
          (node.operationTypeDefinitionSet || "")
        );
      },
    },
    SchemaExtension: {
      leave(node) {
        return (
          printNodeWithComments("extend schema", node.comments) +
          printDirectives(node.directives) +
          (node.operationTypeDefinitionSet || "")
        );
      },
    },
    SelectionSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.selections,
          "{",
          "}",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
    StringValue: {
      leave(node) {
        return printNodeWithComments(
          node.block
            ? '"""\n' + node.value.replace(/"""/g, '\\"""') + '"""'
            : JSON.stringify(node.value),
          node.comments
        );
      },
    },
    TypeSystemDirectiveLocation: {
      leave(node) {
        return printNodeWithComments(node.value, node.comments);
      },
    },
    UnionTypeDefinition: {
      leave(node) {
        return (
          printNodeWithComments(
            "union " + node.name,
            node.comments,
            node.description
          ) +
          printDirectives(node.directives) +
          (node.types || "")
        );
      },
    },
    UnionTypeExtension: {
      leave(node) {
        return (
          printNodeWithComments("extend union " + node.name, node.comments) +
          printDirectives(node.directives) +
          (node.types || "")
        );
      },
    },
    Variable: {
      leave(node) {
        return printNodeWithComments("$" + node.name, node.comments);
      },
    },
    VariableDefinition: {
      leave(node) {
        return (
          printNodeWithComments(lead + node.variable + ":", node.comments) +
          node.type +
          printDefaultValue(node.defaultValue) +
          printDirectives(node.directives)
        );
      },
    },
    VariableDefinitionSet: {
      enter() {
        indent();
      },
      leave(node) {
        return printWrappedListWithComments(
          node.definitions,
          "(",
          ")",
          node.commentsOpeningBracket,
          node.commentsClosingBracket
        );
      },
    },
  });
}

function isSingleNode(
  node: AstNode | ReadonlyArray<AstNode> | null
): node is AstNode {
  return node ? !Array.isArray(node) : false;
}
