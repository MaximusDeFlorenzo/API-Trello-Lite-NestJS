import { forwardRef, Module } from "@nestjs/common";

import { MongooseModule } from "@nestjs/mongoose";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { UsersController } from "./users.controller";
import { User, UserSchema } from "libs/model/entities/user.entity";
import { ConfigModule } from "../../config/config.module";
import { AuthModule } from "../auth/auth.module";
import { MailerModule } from "@nestjs-modules/mailer";
import { LogModule } from "../log/log.module";
import { PermissionModule } from "../permission/permission.module";
import { MinioModule } from "../minio/minio.module";
import { SettingsModule } from "../settings/settings.module";
import { N8NModule } from "../n8n";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => ConfigModule),
    forwardRef(() => PermissionModule),
    LogModule,
    MailerModule,
    MinioModule,
    N8NModule,
    SettingsModule,
  ],
  controllers: [UsersController],
  providers: [UsersResolver, UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
