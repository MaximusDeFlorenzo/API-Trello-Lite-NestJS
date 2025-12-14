import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { UserService } from "../user/users.service";
import { Request } from 'express';

@Injectable()
export class OptionalRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers?.authorization;

    // If no authorization header, continue as unauthenticated
    if (!authHeader) {
      return true;
    }

    const [bearer, token] = authHeader.split(" ");

    // If no valid bearer token, continue as unauthenticated
    if (bearer !== "Bearer" || !token) {
      return true;
    }

    try {
      // Verify the token
      const tokenData = await this.authService.verify(token);

      // If no user ID in token, continue as unauthenticated
      if (!tokenData?.id) {
        return true;
      }

      // Find and attach user to request if exists
      const user = await this.userService.findOne(tokenData.id);
      if (user) {
        request.user = user;
      }

      return true;
    } catch (error) {
      // On any error, continue as unauthenticated
      return true;
    }
  }
}
