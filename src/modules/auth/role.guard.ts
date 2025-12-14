import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { GqlExecutionContext } from "@nestjs/graphql";
import { UsersService } from "src/modules/user/users.service";
import { Request } from "express";
import { User } from "libs/model/entities/user.entity";
import { ROLES_KEY } from "libs/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      const httpRequest = context.switchToHttp().getRequest<Request>();
      if (!roles || roles?.length === 0) return true;

      const ctx = GqlExecutionContext.create(context).getContext<{
        req: Request;
        user?: User;
      }>();

      const token: string | undefined =
        ctx?.req?.headers?.authorization ?? httpRequest?.headers?.authorization;
      if (!token) return false;
      const tokenData = await this.authService.verify(token);
      const user = await this.usersService.findOneById(tokenData.id);

      if (!user) return false;
      ctx.user = user;

      if (user.title.includes("Admin")) return true;
      if (roles.includes(user.title)) return true;

      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      throw new HttpException({ message }, HttpStatus.UNAUTHORIZED);
    }
  }
}
