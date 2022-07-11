import type { DirectiveLocationNode } from "@graphql-modular/language";

export type Schema = {
  description?: Maybe<string>;
  rootTypes: {
    query: ObjectType;
    mutation?: Maybe<ObjectType>;
    subscription?: Maybe<ObjectType>;
  };
  directives?: Maybe<Directive[]>;
};

export type Type =
  | ScalarType<unknown>
  | ObjectType
  | InterfaceType
  | UnionType
  | EnumType
  | InputObjectType
  | { kind: Wrapper; ofType: Type };

export type InputType =
  | ScalarType<unknown>
  | EnumType
  | InputObjectType
  | { kind: Wrapper; ofType: InputType };

export type OutputType =
  | ScalarType<unknown>
  | ObjectType
  | InterfaceType
  | UnionType
  | EnumType
  | { kind: Wrapper; ofType: OutputType };

type Wrapper = "NON_NULL" | "LIST";

export type ScalarType<Internal, External = any> = {
  kind: "SCALAR";
  description?: Maybe<string>;
  name: string;
  directives?: Maybe<Directive[]>;
  extensions?: Maybe<ScalarExtension[]>;
  parse(value: External): Internal;
  serialize(value: Internal): External;
};

export type ScalarExtension = {
  directives: Directive[];
};

export type ObjectType = {
  kind: "OBJECT";
  description?: Maybe<string>;
  name: string;
  implements?: Maybe<InterfaceType[]>;
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: Field };
  extensions?: Maybe<ObjectExtension[]>;
};

export type ObjectExtension = {
  implements?: Maybe<InterfaceType[]>;
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: Field };
};

export type InterfaceType = {
  kind: "INTERFACE";
  description?: Maybe<string>;
  name: string;
  implements?: Maybe<InterfaceType[]>;
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: Field };
  extensions?: Maybe<InterfaceExtension[]>;
};

export type InterfaceExtension = {
  implements?: Maybe<InterfaceType[]>;
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: Field };
};

export type UnionType = {
  kind: "UNION";
  description?: Maybe<string>;
  name: string;
  directives?: Maybe<Directive[]>;
  unionMemberTypes: ObjectType[];
  extensions?: Maybe<UnionExtension[]>;
};

export type UnionExtension = {
  directives?: Maybe<Directive[]>;
  unionMemberTypes: ObjectType[];
};

export type EnumType = {
  kind: "ENUM";
  description?: Maybe<string>;
  name: string;
  directives?: Maybe<Directive[]>;
  values: { [name: string]: EnumValue };
  extensions?: Maybe<EnumExtension[]>;
};

export type EnumExtension = {
  directives?: Maybe<Directive[]>;
  values: { [name: string]: EnumValue };
};

export type InputObjectType = {
  kind: "INPUT_OBJECT";
  description?: Maybe<string>;
  name: string;
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: InputValue };
  extensions?: Maybe<InputObjectExtension[]>;
};

export type InputObjectExtension = {
  directives?: Maybe<Directive[]>;
  fields: { [name: string]: InputValue };
};

export type Directive = {
  kind: "DIRECTIVE";
  description?: Maybe<string>;
  name: string;
  args?: Maybe<{ [name: string]: InputValue }>;
  isRepeatable?: Maybe<boolean>;
  locations: DirectiveLocationNode["value"][];
};

export type Field = {
  description?: Maybe<string>;
  args?: Maybe<{ [name: string]: InputValue }>;
  type: OutputType;
  directives?: Maybe<Directive[]>;
};

export type InputValue = {
  description?: Maybe<string>;
  type: InputType;
  defaultValue: unknown;
  directives?: Maybe<Directive[]>;
};

export type EnumValue = {
  description?: Maybe<string>;
  directives?: Maybe<Directive[]>;
};

type Maybe<T> = T | null | undefined;
