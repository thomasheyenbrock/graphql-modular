import { EXECUTABLE_DIRECTIVE_LOCATION } from "@graphql-modular/language";
import { Boolean } from "@graphql-modular/scalar-boolean";
import type { Directive } from "@graphql-modular/type-system";

export const include: Directive = {
  kind: "DIRECTIVE",
  description:
    "Directs the executor to include this field or fragment only when the `if` argument is true.",
  name: "include",
  args: {
    if: {
      type: { kind: "NON_NULL", ofType: Boolean },
      description: "Included when true.",
    },
  },
  isRepeatable: false,
  locations: [
    EXECUTABLE_DIRECTIVE_LOCATION.FIELD,
    EXECUTABLE_DIRECTIVE_LOCATION.FRAGMENT_SPREAD,
    EXECUTABLE_DIRECTIVE_LOCATION.INLINE_FRAGMENT,
  ],
};
