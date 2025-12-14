import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'libs/model/entities';

interface HttpRequest {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined => {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    return request.user;
  },
);