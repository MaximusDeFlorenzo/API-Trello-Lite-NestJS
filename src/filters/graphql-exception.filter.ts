import { Catch, HttpException } from "@nestjs/common";
import { GqlExceptionFilter } from "@nestjs/graphql";
import { ApolloError } from "apollo-server-express";

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === "object" &&
        response !== null &&
        "message" in response
          ? (response as { message?: unknown }).message
          : exception.message;

      return new ApolloError(
        typeof message === "string" ? message : "Internal server error",
        exception.getStatus().toString(),
      );
    }

    const errorMessage =
      exception instanceof Error ? exception.message : "Internal server error";

    return new ApolloError(errorMessage, "INTERNAL_SERVER_ERROR");
  }
}
