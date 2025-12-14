import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode, ObjectValueNode } from "graphql";

interface GraphQLFieldNode {
  name: {
    value: string;
  };
  value: ValueNode;
}

@Scalar("JSON", () => Object)
export class JSONScalar implements CustomScalar<unknown, unknown> {
  description = "JSON custom scalar type";

  parseValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error("Invalid JSON string");
      }
    }
    throw new Error("Value must be a valid JSON object or string");
  }

  serialize(value: unknown): unknown {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  parseLiteral(ast: ValueNode): unknown {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        throw new Error("Invalid JSON string in literal");
      }
    }
    if (ast.kind === Kind.OBJECT) {
      return this.parseObjectLiteral(ast);
    }
    if (ast.kind === Kind.NULL) {
      return null;
    }
    throw new Error("Literal must be a valid JSON object or string");
  }

  private parseObjectLiteral(ast: ObjectValueNode): Record<string, unknown> {
    const value: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    ast.fields.forEach((field: GraphQLFieldNode) => {
      value[field.name.value] = this.parseLiteral(field.value);
    });
    return value;
  }
}
