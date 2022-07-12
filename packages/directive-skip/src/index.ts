import { EXECUTABLE_DIRECTIVE_LOCATION } from "@graphql-modular/language";
import { Boolean } from "@graphql-modular/scalar-boolean";
import type { Directive } from "@graphql-modular/type-system";

export const skip: Directive = {
  kind: "DIRECTIVE",
  description:
    "Directs the executor to skip this field or fragment when the `if` argument is true.",
  name: "skip",
  args: {
    if: {
      type: { kind: "NON_NULL", ofType: Boolean },
      description: "Skipped when true.",
    },
  },
  isRepeatable: false,
  locations: [
    EXECUTABLE_DIRECTIVE_LOCATION.FIELD,
    EXECUTABLE_DIRECTIVE_LOCATION.FRAGMENT_SPREAD,
    EXECUTABLE_DIRECTIVE_LOCATION.INLINE_FRAGMENT,
  ],
};
