import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";

type RequestWithUser = {
  user?: unknown;
};

function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "email" in obj;
}

function isWrappedUser(obj: unknown): obj is { user: User } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "user" in obj &&
    isUser((obj as { user: unknown }).user)
  );
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined => {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext<{ req: RequestWithUser }>();
    const rawUser = req.user;

    if (isUser(rawUser)) return rawUser;
    if (isWrappedUser(rawUser)) return rawUser.user;
    return undefined;
  },
);
