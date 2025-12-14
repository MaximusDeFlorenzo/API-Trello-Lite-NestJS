import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule } from "src/config/config.module";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "src/modules/user/users.module";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ConfigService } from "src/config/config.service";
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.JWT_SECRET,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, ConfigService],
  exports: [AuthService, JwtModule, JwtAuthGuard, ConfigService],
})
export class AuthModule { }