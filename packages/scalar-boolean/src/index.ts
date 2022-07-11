import { serializeObject } from "@graphql-modular/helper-serialize-object";
import type { ScalarType } from "@graphql-modular/type-system";

export const Boolean: ScalarType<boolean, boolean> = {
  kind: "SCALAR",
  name: "Boolean",
  description: "The `Boolean` scalar type represents `true` or `false`.",

  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);

    if (typeof coercedValue === "boolean") {
      return coercedValue;
    }
    if (Number.isFinite(coercedValue)) {
      return coercedValue !== 0;
    }
    throw new Error(
      `Boolean cannot represent a non boolean value: ${coercedValue}`
    );
  },

  parse(inputValue) {
    if (typeof inputValue !== "boolean") {
      throw new Error(
        `Boolean cannot represent a non boolean value: ${inputValue}`
      );
    }
    return inputValue;
  },
};
