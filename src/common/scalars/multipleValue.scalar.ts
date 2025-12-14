import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("MultpleValue")
export class MultpleValueScalar implements CustomScalar<any, any> {
  description = "Any value scalar type (string, number, boolean)";

  parseValue(value: any): any {
    return value;
  }

  serialize(value: any): any {
    return value;
  }

  parseLiteral(ast: ValueNode): any {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value;
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      default:
        return null;
    }
  }
}
