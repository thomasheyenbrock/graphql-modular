import { serializeObject } from "@graphql-modular/helper-serialize-object";
import type { ScalarType } from "@graphql-modular/type-system";

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
        `Int cannot represent non 32-bit signed integer value: ${coercedValue}`
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
