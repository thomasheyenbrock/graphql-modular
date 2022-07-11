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

// move this info packages
export const Int: ScalarType<number, number> = {
  kind: "SCALAR",
  name: "Int",
  description:
    "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);

    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }

    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }

    if (typeof num !== "number" || !Number.isInteger(num)) {
      throw new Error(
        `Int cannot represent non-integer value: ${coercedValue}`
      );
    }
    if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
      throw new Error(
        "Int cannot represent non 32-bit signed integer value: " + coercedValue
      );
    }
    return num;
  },
  parse(inputValue) {
    if (typeof inputValue !== "number" || !Number.isInteger(inputValue)) {
      throw new Error(`Int cannot represent non-integer value: ${inputValue}`);
    }
    if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
      throw new Error(
        `Int cannot represent non 32-bit signed integer value: ${inputValue}`
      );
    }
    return inputValue;
  },
};

const GRAPHQL_MIN_INT = -2147483648;
const GRAPHQL_MAX_INT = 2147483647;

export const String: ScalarType<string, string> = {
  kind: "SCALAR",
  name: "String",
  description:
    "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);

    // Serialize string, boolean and number values to a string, but do not
    // attempt to coerce object, function, symbol, or other types as strings.
    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (typeof coercedValue === "boolean") {
      return coercedValue ? "true" : "false";
    }
    if (typeof coercedValue === "number" && Number.isFinite(coercedValue)) {
      return coercedValue.toString();
    }
    throw new Error(`String cannot represent value: ${outputValue}`);
  },
  parse(inputValue) {
    if (typeof inputValue !== "string") {
      throw new Error(
        `String cannot represent a non string value: ${inputValue}`
      );
    }
    return inputValue;
  },
};

// Support serializing objects with custom valueOf() or toJSON() functions -
// a common way to represent a complex value which can be represented as
// a string (ex: MongoDB id objects).
function serializeObject(outputValue: unknown): unknown {
  if (isObjectLike(outputValue)) {
    if (typeof outputValue.valueOf === "function") {
      const valueOfResult = outputValue.valueOf();
      if (!isObjectLike(valueOfResult)) {
        return valueOfResult;
      }
    }
    if (typeof outputValue.toJSON === "function") {
      return outputValue.toJSON();
    }
  }
  return outputValue;
}

function isObjectLike(value: unknown): value is { [key: string]: unknown } {
  return typeof value == "object" && value !== null;
}
