import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from "src/config/config.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from "src/modules/user/users.module";
import { AuthService } from './auth.service';
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ConfigService } from "src/config/config.service";
import { AuthController } from './auth.controller';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.JWT_SECRET,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    TokenBlacklistService,
  ],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    TokenBlacklistService,
  ],
})
export class AuthModule { }