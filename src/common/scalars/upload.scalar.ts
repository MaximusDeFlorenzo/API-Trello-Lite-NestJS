import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("Upload", () => Object)
export class UploadScalar implements CustomScalar<any, any> {
  description = "Upload scalar type";

  parseValue(value: any): any {
    return value;
  }

  serialize(value: any): any {
    return value;
  }

  parseLiteral(ast: ValueNode): any {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  }
}
