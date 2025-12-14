import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("DateTime", () => Date)
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = "DateTime custom scalar type";

  parseValue(value: unknown): Date {
    if (typeof value === "string") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
      }
      return date;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === "number") {
      return new Date(value);
    }
    throw new Error(
      "Value must be a valid date string, Date object, or timestamp",
    );
  }

  serialize(value: unknown): string {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new Error("Invalid Date object");
      }
      return value.toISOString();
    }
    if (typeof value === "string") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
      }
      return date.toISOString();
    }
    if (typeof value === "number") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid timestamp");
      }
      return date.toISOString();
    }
    throw new Error(
      "Value must be a valid Date object, date string, or timestamp",
    );
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string in literal");
      }
      return date;
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new Error("Literal must be a valid date string or timestamp");
  }
}
