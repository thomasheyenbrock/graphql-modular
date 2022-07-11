import { serializeObject } from "@graphql-modular/helper-serialize-object";
import type { ScalarType } from "@graphql-modular/type-system";

export const ID: ScalarType<string, string> = {
  kind: "SCALAR",
  name: "ID",
  description:
    'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',

  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);

    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (Number.isInteger(coercedValue)) {
      return String(coercedValue);
    }
    throw new Error(`ID cannot represent value: ${outputValue}`);
  },

  parse(inputValue) {
    if (typeof inputValue === "string") {
      return inputValue;
    }
    if (typeof inputValue === "number" && Number.isInteger(inputValue)) {
      return (inputValue as any).toString();
    }
    throw new Error(`ID cannot represent value: ${inputValue}`);
  },
};
