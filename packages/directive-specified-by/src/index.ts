import { TYPE_SYSTEM_DIRECTIVE_LOCATION } from "@graphql-modular/language";
import { String } from "@graphql-modular/scalar-string";
import type { Directive } from "@graphql-modular/type-system";

export const specifiedBy: Directive = {
  kind: "DIRECTIVE",
  description: "Exposes a URL that specifies the behavior of this scalar.",
  name: "specifiedBy",
  args: {
    if: {
      type: { kind: "NON_NULL", ofType: String },
      description: "The URL that specifies the behavior of this scalar.",
      defaultValue: "No longer supported",
    },
  },
  isRepeatable: false,
  locations: [TYPE_SYSTEM_DIRECTIVE_LOCATION.SCALAR],
};
