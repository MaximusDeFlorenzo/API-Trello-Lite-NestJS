import {
  CustomDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { UsersService } from "src/modules/user/users.service";
import { TokenDto } from "./dto/token.dto";
import { SettingsService } from "src/modules/settings/settings.service";
import { User } from "libs/model/entities/user.entity";

const IS_PUBLIC_KEY = "isPublic";
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

interface GraphQLContext {
  req?: {
    headers?: {
      authorization?: string;
    };
    user?: {
      user: User;
      permissions: string[];
    };
  };
  connection?: {
    context?: {
      user?: {
        user: User;
        permissions: string[];
      };
    };
  };
  user?: unknown;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
  ) {
    super();
    this.canActivate = this.canActivate.bind(this) as this["canActivate"];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const gqlContext = GqlExecutionContext.create(context);
    const rawContext: unknown = gqlContext.getContext();
    const ctx: GraphQLContext = rawContext as GraphQLContext;
    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();

    if (ctx?.req?.user) return true;

    if (ctx?.user && typeof ctx.user === "object" && "user" in ctx.user) {
      if (!ctx.req)
        ctx.req = {
          headers: {},
          user: ctx.user as { user: User; permissions: string[] },
        };
      else ctx.req.user = ctx.user as { user: User; permissions: string[] };
      return true;
    }

    if (ctx?.connection?.context?.user) {
      if (!ctx.req)
        ctx.req = { headers: {}, user: ctx.connection.context.user };
      else ctx.req.user = ctx.connection.context.user;
      return true;
    }

    try {
      const token: string | undefined =
        ctx?.req?.headers?.authorization ?? request?.headers?.authorization;

      if (!token) {
        throw new HttpException(
          "You must provide token!",
          HttpStatus.FORBIDDEN,
        );
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "");
      const tokenData: TokenDto = await this.authService.verify(cleanToken);

      const currentGlobalLogoutVersion =
        await this.settingsService.getGlobalLogoutVersion();
      const tokenGlobalLogoutVersion = tokenData.isGlobalLogOut;

      if (
        !tokenGlobalLogoutVersion ||
        tokenGlobalLogoutVersion !== currentGlobalLogoutVersion
      ) {
        throw new HttpException(
          "Token has been invalidated due to global logout",
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.usersService.findOneById(tokenData.id);

      if (!user) {
        throw new HttpException("User not found!", HttpStatus.FORBIDDEN);
      }

      const permissions = user.permissions?.map((p) => p.name) || [];

      const userContext = {
        user,
        permissions,
      };

      if (!ctx.req) {
        ctx.req = {
          headers: request?.headers || {},
          user: userContext,
        };
      } else ctx.req.user = userContext;

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Forbidden";
      throw new HttpException(message, HttpStatus.FORBIDDEN);
    }
  }
}
