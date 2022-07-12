export const EXECUTABLE_DIRECTIVE_LOCATION = {
  QUERY: "QUERY",
  MUTATION: "MUTATION",
  SUBSCRIPTION: "SUBSCRIPTION",
  FIELD: "FIELD",
  FRAGMENT_DEFINITION: "FRAGMENT_DEFINITION",
  FRAGMENT_SPREAD: "FRAGMENT_SPREAD",
  INLINE_FRAGMENT: "INLINE_FRAGMENT",
  VARIABLE_DEFINITION: "VARIABLE_DEFINITION",
} as const;

export type ExecutableDirectiveLocation =
  typeof EXECUTABLE_DIRECTIVE_LOCATION[keyof typeof EXECUTABLE_DIRECTIVE_LOCATION];

export function isExecutableDirectiveLocation(
  value: any
): value is ExecutableDirectiveLocation {
  for (const key in EXECUTABLE_DIRECTIVE_LOCATION)
    if ((EXECUTABLE_DIRECTIVE_LOCATION as any)[key] === value) return true;
  return false;
}
