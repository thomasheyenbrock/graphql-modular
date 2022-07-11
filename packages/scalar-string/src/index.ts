import { serializeObject } from "@graphql-modular/helper-serialize-object";
import type { ScalarType } from "@graphql-modular/type-system";

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
