import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { GqlExecutionContext } from "@nestjs/graphql";
import { LogService } from "../modules/log/log.service";
import { Reflector } from "@nestjs/core";
import { ObjectId } from "mongodb";

export const LOG_ACTIVITY = "logActivity";

export interface ActivityLogOptions {
  activityType: string;
  description?: string;
  includeArgs?: boolean;
  includeResult?: boolean;
}

export const LogActivity = (options: ActivityLogOptions) =>
  SetMetadata(LOG_ACTIVITY, options);

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logService: LogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logOptions = this.reflector.get<ActivityLogOptions>(
      LOG_ACTIVITY,
      context.getHandler(),
    );

    if (!logOptions) {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext<{
      req: {
        user?: { _id?: string; id?: string };
        ip?: string;
        connection?: { remoteAddress?: string };
        get: (header: string) => string | undefined;
      };
    }>();
    const args: Record<string, unknown> = gqlContext.getArgs();

    const user = req?.user;
    const userId = user?._id || user?.id;
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const userAgent = req?.get("User-Agent");

    const startTime = Date.now();

    return next.handle().pipe(
      tap((result) => {
        void this.logActivity(
          logOptions,
          userId,
          ipAddress,
          userAgent,
          args,
          result,
          "SUCCESS",
          Date.now() - startTime,
        );
      }),
      catchError((error) => {
        void this.logActivity(
          logOptions,
          userId,
          ipAddress,
          userAgent,
          args,
          null,
          "ERROR",
          Date.now() - startTime,
          (error as Error)?.message,
        );
        throw error;
      }),
    );
  }

  private async logActivity(
    options: ActivityLogOptions,
    userId: string | undefined,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    args: unknown,
    result: unknown,
    status: string,
    duration: number,
    errorMessage?: string,
  ) {
    try {
      const metadata: Record<string, any> = {
        duration: `${duration}ms`,
      };

      if (options.includeArgs && args) {
        metadata.args = args as Record<string, unknown>;
      }

      if (options.includeResult && result && status === "SUCCESS") {
        metadata.result = result as Record<string, unknown>;
      }

      const description =
        options.description || `${options.activityType} operation`;

      const log = {
        description: options.activityType,
        activityType: description,
        userId: userId ? new ObjectId(userId) : undefined,
        metadata: metadata,
        status: status,
        createdBy: userId ? new ObjectId(userId) : undefined,
        ipAddress: ipAddress,
        userAgent: userAgent,
        errorMessage: errorMessage,
      };
      await this.logService.logActivity(log);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }
  }
}
