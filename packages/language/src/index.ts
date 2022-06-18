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
  SelectionSet: SelectionSetNode;
  Field: FieldNode;
  FragmentSpread: FragmentSpreadNode;
  InlineFragment: InlineFragmentNode;
  SchemaDefinition: SchemaDefinitionNode;
  SchemaExtension: SchemaExtensionNode;
  OperationTypeDefinitionSet: OperationTypeDefinitionSetNode;
  OperationTypeDefinition: OperationTypeDefinitionNode;
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
  EnumValueDefinitionSet: EnumValueDefinitionSetNode;
  EnumValueDefinition: EnumValueDefinitionNode;
  InputObjectTypeDefinition: InputObjectTypeDefinitionNode;
  InputObjectTypeExtension: InputObjectTypeExtensionNode;
  DirectiveDefinition: DirectiveDefinitionNode;
  VariableDefinitionSet: VariableDefinitionSetNode;
  VariableDefinition: VariableDefinitionNode;
  Directive: DirectiveNode | DirectiveConstNode;
  Argument: ArgumentNode | ArgumentConstNode;
  FieldDefinitionSet: FieldDefinitionSetNode;
  FieldDefinition: FieldDefinitionNode;
  InputValueDefinitionSet: InputValueDefinitionSetNode;
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
  comments: CommentNode[];
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
  comments: CommentNode[];
  operation: OperationType;
  name: NameNode | null;
  variableDefinitionSet: VariableDefinitionSetNode | null;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
};

export type FragmentDefinitionNode = {
  kind: "FragmentDefinition";
  comments: CommentNode[];
  name: NameNode;
  typeCondition: NamedTypeNode;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
};

export type OperationType = "query" | "mutation" | "subscription";

export type SelectionSetNode = {
  kind: "SelectionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  selections: SelectionNode[];
};

export type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;

export type FieldNode = {
  kind: "Field";
  comments: CommentNode[];
  alias: NameNode | null;
  name: NameNode;
  argumentSet: ArgumentSetNode | null;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode | null;
};

export type FragmentSpreadNode = {
  kind: "FragmentSpread";
  comments: CommentNode[];
  name: NameNode;
  directives: DirectiveNode[];
};

export type InlineFragmentNode = {
  kind: "InlineFragment";
  comments: CommentNode[];
  typeCondition: NamedTypeNode | null;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
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
  comments: CommentNode[];
  description: StringValueNode | null;
  directives: DirectiveConstNode[];
  operationTypeDefinitionSet: OperationTypeDefinitionSetNode | null;
};

export type SchemaExtensionNode = {
  kind: "SchemaExtension";
  comments: CommentNode[];
  directives: DirectiveConstNode[];
  operationTypeDefinitionSet: OperationTypeDefinitionSetNode | null;
};

export type OperationTypeDefinitionSetNode = {
  kind: "OperationTypeDefinitionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  definitions: OperationTypeDefinitionNode[];
};

export type OperationTypeDefinitionNode = {
  kind: "OperationTypeDefinition";
  comments: CommentNode[];
  operation: OperationType;
  type: NamedTypeNode;
};

export type ScalarTypeDefinitionNode = {
  kind: "ScalarTypeDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
};

export type ScalarTypeExtensionNode = {
  kind: "ScalarTypeExtension";
  comments: CommentNode[];
  name: NameNode;
  directives: DirectiveConstNode[];
};

export type ObjectTypeDefinitionNode = {
  kind: "ObjectTypeDefinition";
  comments: CommentNode[];
  commentsInterfaces: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fieldDefinitionSet: FieldDefinitionSetNode | null;
};

export type ObjectTypeExtensionNode = {
  kind: "ObjectTypeExtension";
  comments: CommentNode[];
  commentsInterfaces: CommentNode[];
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fieldDefinitionSet: FieldDefinitionSetNode | null;
};

export type InterfaceTypeDefinitionNode = {
  kind: "InterfaceTypeDefinition";
  comments: CommentNode[];
  commentsInterfaces: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fieldDefinitionSet: FieldDefinitionSetNode | null;
};

export type InterfaceTypeExtensionNode = {
  kind: "InterfaceTypeExtension";
  comments: CommentNode[];
  commentsInterfaces: CommentNode[];
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveConstNode[];
  fieldDefinitionSet: FieldDefinitionSetNode | null;
};

export type UnionTypeDefinitionNode = {
  kind: "UnionTypeDefinition";
  comments: CommentNode[];
  commentsTypes: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  types: NamedTypeNode[];
};

export type UnionTypeExtensionNode = {
  kind: "UnionTypeExtension";
  comments: CommentNode[];
  commentsTypes: CommentNode[];
  name: NameNode;
  directives: DirectiveConstNode[];
  types: NamedTypeNode[];
};

export type EnumTypeDefinitionNode = {
  kind: "EnumTypeDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  valueDefinitionSet: EnumValueDefinitionSetNode | null;
};

export type EnumTypeExtensionNode = {
  kind: "EnumTypeExtension";
  comments: CommentNode[];
  name: NameNode;
  directives: DirectiveConstNode[];
  valueDefinitionSet: EnumValueDefinitionSetNode | null;
};

export type EnumValueDefinitionSetNode = {
  kind: "EnumValueDefinitionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  definitions: EnumValueDefinitionNode[];
};

export type EnumValueDefinitionNode = {
  kind: "EnumValueDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: EnumValueNode;
  directives: DirectiveConstNode[];
};

export type InputObjectTypeDefinitionNode = {
  kind: "InputObjectTypeDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  directives: DirectiveConstNode[];
  inputValueDefinitionSet: InputValueDefinitionSetNode | null;
};

export type InputObjectTypeExtensionNode = {
  kind: "InputObjectTypeExtension";
  comments: CommentNode[];
  name: NameNode;
  directives: DirectiveConstNode[];
  inputValueDefinitionSet: InputValueDefinitionSetNode | null;
};

export type DirectiveDefinitionNode = {
  kind: "DirectiveDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  inputValueDefinitionSet: InputValueDefinitionSetNode | null;
  repeatable: boolean;
  locationSet: DirectiveLocationSetNode;
};

export type DirectiveLocationSetNode = {
  kind: "DirectiveLocationSet";
  comments: CommentNode[];
  locations: DirectiveLocationNode[];
};

export type DirectiveLocationNode =
  | ExecutableDirectiveLocationNode
  | TypeSystemDirectiveLocationNode;

export type ExecutableDirectiveLocationNode = {
  kind: "ExecutableDirectiveLocation";
  comments: CommentNode[];
  value: typeof EXECUTABLE_DIRECTIVE_LOCATION[number];
};

export type TypeSystemDirectiveLocationNode = {
  kind: "TypeSystemDirectiveLocation";
  comments: CommentNode[];
  value: typeof TYPE_SYSTEM_DIRECTIVE_LOCATION[number];
};

export type VariableDefinitionSetNode = {
  kind: "VariableDefinitionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  definitions: VariableDefinitionNode[];
};

export type VariableDefinitionNode = {
  kind: "VariableDefinition";
  comments: CommentNode[];
  variable: VariableNode;
  type: TypeNode;
  defaultValue: ValueConstNode | null;
  directives: DirectiveConstNode[];
};

export type DirectiveNode = {
  kind: "Directive";
  comments: CommentNode[];
  name: NameNode;
  argumentSet: ArgumentSetNode | null;
};

export type ArgumentSetNode = {
  kind: "ArgumentSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  args: ArgumentNode[];
};

export type ArgumentNode = {
  kind: "Argument";
  comments: CommentNode[];
  name: NameNode;
  value: ValueNode;
};

export type DirectiveConstNode = {
  kind: "Directive";
  comments: CommentNode[];
  name: NameNode;
  argumentSet: ArgumentSetConstNode | null;
};

export type ArgumentSetConstNode = {
  kind: "ArgumentSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  args: ArgumentConstNode[];
};

export type ArgumentConstNode = {
  kind: "Argument";
  comments: CommentNode[];
  name: NameNode;
  value: ValueConstNode;
};

export type FieldDefinitionSetNode = {
  kind: "FieldDefinitionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  definitions: FieldDefinitionNode[];
};

export type FieldDefinitionNode = {
  kind: "FieldDefinition";
  comments: CommentNode[];
  description: StringValueNode | null;
  name: NameNode;
  inputValueDefinitionSet: InputValueDefinitionSetNode | null;
  type: TypeNode;
  directives: DirectiveConstNode[];
};

export type InputValueDefinitionSetNode = {
  kind: "InputValueDefinitionSet";
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  definitions: InputValueDefinitionNode[];
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
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  values: ValueNode[];
};

export type ObjectValueNode = {
  kind: "ObjectValue";
  commentsOpeningBracket: CommentNode[];
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
  commentsOpeningBracket: CommentNode[];
  commentsClosingBracket: CommentNode[];
  values: ValueConstNode[];
};

export type ObjectValueConstNode = {
  kind: "ObjectValue";
  commentsOpeningBracket: CommentNode[];
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
