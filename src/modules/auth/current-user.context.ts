import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";

interface GraphQLContext {
  req: {
    user: {
      user: User;
      permissions: string[];
    };
  };
}

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
    const gqlCtx =
      GqlExecutionContext.create(context).getContext<GraphQLContext>();
    if (gqlCtx.req?.user) {
      return gqlCtx.req.user;
    }

    const httpReq = context.switchToHttp().getRequest<HttpRequest>();
    return httpReq.user;
  },
);
