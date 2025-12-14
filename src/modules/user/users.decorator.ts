import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from 'express';
import { User } from "libs/model/entities/user.entity";

function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "email" in obj;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User | { user: User } | undefined;

    if (!user) {
      return undefined;
    }

    if (isUser(user)) {
      return user;
    }

    if (user && typeof user === 'object' && 'user' in user && isUser(user.user)) {
      return user.user;
    }

    return undefined;
  },
);
