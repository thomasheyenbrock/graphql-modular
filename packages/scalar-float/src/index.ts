import { serializeObject } from "@graphql-modular/helper-serialize-object";
import type { ScalarType } from "@graphql-modular/type-system";

export const Float: ScalarType<number, number> = {
  kind: "SCALAR",
  name: "Float",
  description:
    "The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).",

  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);

    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }

    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }

    if (typeof num !== "number" || !Number.isFinite(num)) {
      throw new Error(
        `Float cannot represent non numeric value: ${coercedValue}`
      );
    }
    return num;
  },

  parse(inputValue) {
    if (typeof inputValue !== "number" || !Number.isFinite(inputValue)) {
      throw new Error(
        `Float cannot represent non numeric value: ${inputValue}`
      );
    }
    return inputValue;
  },
};
