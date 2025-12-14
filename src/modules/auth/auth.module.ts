import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { MfaService } from "./mfa.service";
import { ConfigModule } from "src/config/config.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "src/config/config.service";
import { UsersModule } from "src/modules/user/users.module";
import { JwtAuthGuard } from "./jwt-auth.guard";

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
  providers: [AuthService, MfaService, JwtAuthGuard],
  exports: [AuthService, MfaService, JwtModule, JwtAuthGuard],
})
export class AuthModule { }
