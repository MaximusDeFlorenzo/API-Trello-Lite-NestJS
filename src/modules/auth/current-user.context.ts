import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "libs/model/entities/user.entity";

interface HttpRequest {
  user?: {
    user: User;
    permissions: string[];
  };
}

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): { user: User; permissions: string[] } | undefined => {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    return request.user;
  },
);
