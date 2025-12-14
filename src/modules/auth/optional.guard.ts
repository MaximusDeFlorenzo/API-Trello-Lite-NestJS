import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { GqlExecutionContext } from "@nestjs/graphql";
import { UsersService } from "src/modules/user/users.service";

interface GqlContext {
  req?: {
    headers?: {
      authorization?: string;
    };
  };
  user?: unknown;
}

interface HttpRequest {
  headers?: {
    authorization?: string;
  };
}

@Injectable()
export class OptionalRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx: GqlContext = GqlExecutionContext.create(context).getContext();
    const request: HttpRequest = context.switchToHttp().getRequest();

    const authHeader =
      ctx?.req?.headers?.authorization ?? request?.headers?.authorization;
    if (!authHeader) {
      return true;
    }

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return true;
    }

    try {
      const tokenData = await this.authService.verify(token);
      if (!tokenData?.id) {
        return true;
      }

      const user = await this.usersService.findOneById(tokenData.id);
      if (user) ctx.user = user;

      return true;
    } catch (error) {
      console.error("OptionalRolesGuard error:", error);
      return true;
    }
  }
}
