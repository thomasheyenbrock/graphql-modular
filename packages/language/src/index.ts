export const EXECUTABLE_DIRECTIVE_LOCATION = [
  "QUERY",
  "MUTATION",
  "SUBSCRIPTION",
  "FIELD",
  "FRAGMENT_DEFINITION",
  "FRAGMENT_SPREAD",
  "INLINE_FRAGMENT",
  "VARIABLE_DEFINITION",
] as const;

export const TYPE_SYSTEM_DIRECTIVE_LOCATION = [
  "SCHEMA",
  "SCALAR",
  "OBJECT",
  "FIELD_DEFINITION",
  "ARGUMENT_DEFINITION",
  "INTERFACE",
  "UNION",
  "ENUM",
  "ENUM_VALUE",
  "INPUT_OBJECT",
  "INPUT_FIELD_DEFINITION",
] as const;

export type AstNodes = {
  Document: DocumentNode;
  OperationDefinition: OperationDefinitionNode;
  FragmentDefinition: FragmentDefinitionNode;
  Field: FieldNode;
  FragmentSpread: FragmentSpreadNode;
  InlineFragment: InlineFragmentNode;
  SchemaDefinition: SchemaDefinitionNode;
  OperationTypeDefinition: OperationTypeDefinitionNode;
  SchemaExtension: SchemaExtensionNode;
  ScalarTypeDefinition: ScalarTypeDefinitionNode;
  ScalarTypeExtension: ScalarTypeExtensionNode;
  ObjectTypeDefinition: ObjectTypeDefinitionNode;
  ObjectTypeExtension: ObjectTypeExtensionNode;
  InterfaceTypeDefinition: InterfaceTypeDefinitionNode;
  InterfaceTypeExtension: InterfaceTypeExtensionNode;
  UnionTypeDefinition: UnionTypeDefinitionNode;
  UnionTypeExtension: UnionTypeExtensionNode;
  EnumTypeDefinition: EnumTypeDefinitionNode;
  EnumTypeExtension: EnumTypeExtensionNode;
  EnumValueDefinition: EnumValueDefinitionNode;
  InputObjectTypeDefinition: InputObjectTypeDefinitionNode;
  InputObjectTypeExtension: InputObjectTypeExtensionNode;
  DirectiveDefinition: DirectiveDefinitionNode;
  VariableDefinition: VariableDefinitionNode;
  Directive: DirectiveNode | DirectiveConstNode;
  Argument: ArgumentNode | ArgumentConstNode;
  FieldDefinition: FieldDefinitionNode;
  InputValueDefinition: InputValueDefinitionNode;
  NamedType: NamedTypeNode;
  ListType: ListTypeNode;
  NonNullType: NonNullTypeNode;
  IntValue: IntValueNode;
  FloatValue: FloatValueNode;
  StringValue: StringValueNode;
  BooleanValue: BooleanValueNode;
  NullValue: NullValueNode;
  EnumValue: EnumValueNode;
  ListValue: ListValueNode | ListValueConstNode;
  ObjectValue: ObjectValueNode | ObjectValueConstNode;
  ObjectField: ObjectFieldNode | ObjectFieldConstNode;
  Variable: VariableNode;
  Name: NameNode;
};

export type AstNode = AstNodes[keyof AstNodes];

export type DocumentNode = {
  kind: "Document";
  definitions: DefinitionNode[];
};

export type DefinitionNode =
  | ExecutableDefinitionNode
  | TypeSystemDefinitionOrExtensionNode;

export type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode;

export type OperationDefinitionNode = {
  kind: "OperationDefinition";
  operation: OperationType;
  name: NameNode | null;
  variableDefinitions: VariableDefinitionNode[];
  directives: DirectiveNode[];
  selectionSet: SelectionNode[];
};

export type FragmentDefinitionNode = {
  kind: "FragmentDefinition";
  name: NameNode;
  typeCondition: NamedTypeNode;
  directives: DirectiveNode[];
  selectionSet: SelectionNode[];
};

export type OperationType = "query" | "mutation" | "subscription";

export type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;

export type FieldNode = {
  kind: "Field";
  alias: NameNode | null;
  name: NameNode;
  args: ArgumentNode[];
  directives: DirectiveNode[];
  selectionSet: SelectionNode[];
};

export type FragmentSpreadNode = {
  kind: "FragmentSpread";
  name: NameNode;
  directives: DirectiveNode[];
};

export type InlineFragmentNode = {
  kind: "InlineFragment";
  typeCondition: NamedTypeNode | null;
  directives: DirectiveNode[];
  selectionSet: SelectionNode[];
};

export type TypeSystemDefinitionOrExtensionNode =
  | TypeSystemDefinitionNode
  | TypeSystemExtensionNode;

export type TypeSystemDefinitionNode =
  | SchemaDefinitionNode
  | TypeDefinitionNode
  | DirectiveDefinitionNode;

export type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

export type TypeSystemExtensionNode = SchemaExtensionNode | TypeExtensionNode;

export type TypeExtensionNode =
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode;

export type SchemaDefinitionNode = {
  kind: "SchemaDefinition";
  description: StringValueNode | null;
  directives: DirectiveConstNode[];
  operationTypes: OperationTypeDefinitionNode[];
};

export type OperationTypeDefinitionNode = {
  kind: "OperationTypeDefinition";
  operation: OperationType;
  type: NamedTypeNode;
};

export type SchemaExtensionNode = {
  kind: "SchemaExtension";
  directives: DirectiveConstNode[];
  operationTypes: OperationTypeDefinitionNode[];
};

export type ScalarTypeDefinitionNode = {
  kind: "ScalarTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
};

export type ScalarTypeExtensionNode = {
  kind: "ScalarTypeExtension";
  name: NameNode;
  directives: DirectiveConstNode[];
};

export type ObjectTypeDefinitionNode = {
  kind: "ObjectTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fields: FieldDefinitionNode[];
};

export type ObjectTypeExtensionNode = {
  kind: "ObjectTypeExtension";
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fields: FieldDefinitionNode[];
};

export type InterfaceTypeDefinitionNode = {
  kind: "InterfaceTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fields: FieldDefinitionNode[];
};

export type InterfaceTypeExtensionNode = {
  kind: "InterfaceTypeExtension";
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fields: FieldDefinitionNode[];
};

export type UnionTypeDefinitionNode = {
  kind: "UnionTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  types: NamedTypeNode[];
};

export type UnionTypeExtensionNode = {
  kind: "UnionTypeExtension";
  name: NameNode;
  directives: DirectiveConstNode[];
  types: NamedTypeNode[];
};

export type EnumTypeDefinitionNode = {
  kind: "EnumTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  values: EnumValueDefinitionNode[];
};

export type EnumTypeExtensionNode = {
  kind: "EnumTypeExtension";
  name: NameNode;
  directives: DirectiveConstNode[];
  values: EnumValueDefinitionNode[];
};

export type EnumValueDefinitionNode = {
  kind: "EnumValueDefinition";
  description: StringValueNode | null;
  name: EnumValueNode;
  directives: DirectiveConstNode[];
};

export type InputObjectTypeDefinitionNode = {
  kind: "InputObjectTypeDefinition";
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  fields: InputValueDefinitionNode[];
};

export type InputObjectTypeExtensionNode = {
  kind: "InputObjectTypeExtension";
  name: NameNode;
  directives: DirectiveConstNode[];
  fields: InputValueDefinitionNode[];
};

export type DirectiveDefinitionNode = {
  kind: "DirectiveDefinition";
  description: StringValueNode | null;
  name: NameNode;
  args: InputValueDefinitionNode[];
  repeatable: boolean;
  locations: DirectiveLocationNode[];
};

export type DirectiveLocationNode =
  | ExecutableDirectiveLocationNode
  | TypeSystemDirectiveLocationNode;

export type ExecutableDirectiveLocationNode = {
  kind: "ExecutableDirectiveLocation";
  value: typeof EXECUTABLE_DIRECTIVE_LOCATION[number];
};

export type TypeSystemDirectiveLocationNode = {
  kind: "TypeSystemDirectiveLocation";
  value: typeof TYPE_SYSTEM_DIRECTIVE_LOCATION[number];
};

export type VariableDefinitionNode = {
  kind: "VariableDefinition";
  variable: VariableNode;
  type: TypeNode;
  defaultValue: ValueConstNode | null;
  directives: DirectiveConstNode[];
};

export type DirectiveNode = {
  kind: "Directive";
  name: NameNode;
  args: ArgumentNode[];
};

export type ArgumentNode = {
  kind: "Argument";
  name: NameNode;
  value: ValueNode;
};

export type DirectiveConstNode = {
  kind: "Directive";
  name: NameNode;
  args: ArgumentConstNode[];
};

export type ArgumentConstNode = {
  kind: "Argument";
  name: NameNode;
  value: ValueConstNode;
};

export type FieldDefinitionNode = {
  kind: "FieldDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  args: InputValueDefinitionNode[];
  type: TypeNode;
  directives: DirectiveConstNode[];
};

export type InputValueDefinitionNode = {
  kind: "InputValueDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  type: TypeNode;
  defaultValue: ValueConstNode | null;
  directives: DirectiveConstNode[];
};

export type TypeNode = NamedTypeNode | ListTypeNode | NonNullTypeNode;

export type NamedTypeNode = {
  kind: "NamedType";
  comments: CommentNode[];
  name: NameNode;
};

export type ListTypeNode = {
  kind: "ListType";
  comments: CommentNode[];
  type: TypeNode;
};

export type NonNullTypeNode = {
  kind: "NonNullType";
  comments: CommentNode[];
  type: NamedTypeNode | ListTypeNode;
};

export type ValueNode =
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode;

export type ValueConstNode =
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueConstNode
  | ObjectValueConstNode;

export type IntValueNode = {
  kind: "IntValue";
  comments: CommentNode[];
  value: string;
};

export type FloatValueNode = {
  kind: "FloatValue";
  comments: CommentNode[];
  value: string;
};

export type StringValueNode = {
  kind: "StringValue";
  comments: CommentNode[];
  value: string;
  block: boolean;
};

export type BooleanValueNode = {
  kind: "BooleanValue";
  comments: CommentNode[];
  value: boolean;
};

export type NullValueNode = {
  kind: "NullValue";
  comments: CommentNode[];
};

export type EnumValueNode = {
  kind: "EnumValue";
  comments: CommentNode[];
  value: string;
};

export type ListValueNode = {
  kind: "ListValue";
  commentsOpenBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  values: ValueNode[];
};

export type ObjectValueNode = {
  kind: "ObjectValue";
  commentsOpenBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  fields: ObjectFieldNode[];
};

export type ObjectFieldNode = {
  kind: "ObjectField";
  comments: CommentNode[];
  name: NameNode;
  value: ValueNode;
};

export type ListValueConstNode = {
  kind: "ListValue";
  commentsOpenBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  values: ValueConstNode[];
};

export type ObjectValueConstNode = {
  kind: "ObjectValue";
  commentsOpenBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  fields: ObjectFieldConstNode[];
};

export type ObjectFieldConstNode = {
  kind: "ObjectField";
  comments: CommentNode[];
  name: NameNode;
  value: ValueConstNode;
};

export type VariableNode = {
  kind: "Variable";
  comments: CommentNode[];
  name: NameNode;
};

export type NameNode = {
  kind: "Name";
  comments: CommentNode[];
  value: string;
};

export type CommentNode = BlockCommentNode | InlineCommentNode;

export type BlockCommentNode = {
  kind: "BlockComment";
  value: string;
};

export type InlineCommentNode = {
  kind: "InlineComment";
  value: string;
};
