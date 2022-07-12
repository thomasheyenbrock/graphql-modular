export const TYPE_SYSTEM_DIRECTIVE_LOCATION = {
  SCHEMA: "SCHEMA",
  SCALAR: "SCALAR",
  OBJECT: "OBJECT",
  FIELD_DEFINITION: "FIELD_DEFINITION",
  ARGUMENT_DEFINITION: "ARGUMENT_DEFINITION",
  INTERFACE: "INTERFACE",
  UNION: "UNION",
  ENUM: "ENUM",
  ENUM_VALUE: "ENUM_VALUE",
  INPUT_OBJECT: "INPUT_OBJECT",
  INPUT_FIELD_DEFINITION: "INPUT_FIELD_DEFINITION",
} as const;

export type TypeSystemDirectiveLocation =
  typeof TYPE_SYSTEM_DIRECTIVE_LOCATION[keyof typeof TYPE_SYSTEM_DIRECTIVE_LOCATION];

export function isTypeSystemDirectiveLocation(
  value: any
): value is TypeSystemDirectiveLocation {
  for (const key in TYPE_SYSTEM_DIRECTIVE_LOCATION)
    if ((TYPE_SYSTEM_DIRECTIVE_LOCATION as any)[key] === value) return true;
  return false;
}
