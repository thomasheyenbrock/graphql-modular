import { TYPE_SYSTEM_DIRECTIVE_LOCATION } from "@graphql-modular/language";
import { String } from "@graphql-modular/scalar-string";
import type { Directive } from "@graphql-modular/type-system";

export const deprecated: Directive = {
  kind: "DIRECTIVE",
  description: "Marks an element of a GraphQL schema as no longer supported.",
  name: "deprecated",
  args: {
    if: {
      type: String,
      description:
        "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).",
      defaultValue: "No longer supported",
    },
  },
  isRepeatable: false,
  locations: [
    TYPE_SYSTEM_DIRECTIVE_LOCATION.ARGUMENT_DEFINITION,
    TYPE_SYSTEM_DIRECTIVE_LOCATION.ENUM_VALUE,
    TYPE_SYSTEM_DIRECTIVE_LOCATION.FIELD_DEFINITION,
    TYPE_SYSTEM_DIRECTIVE_LOCATION.INPUT_FIELD_DEFINITION,
  ],
};
