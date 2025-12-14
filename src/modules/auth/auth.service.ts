import {
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "src/config/config.service";
import { TokenDto } from "./dto/token.dto";
import { UsersService } from "src/modules/user/users.service";
import { MfaService } from "./mfa.service";
import { MfaResponse } from "src/modules/user/dto/login-mfa.response";
import { LogService } from "src/modules/log/log.service";
import * as argon2 from "argon2";
import { ObjectId } from "mongodb";
import { SettingsService } from "src/modules/settings/settings.service";
import { User } from "libs/model/entities/user.entity";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { LectureStatus } from "libs/types/lecture.type";

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mfaService: MfaService,
    @Inject(forwardRef(() => LogService))
    private readonly logService: LogService,
    private readonly settingsService: SettingsService,
  ) {
    void this.initializeGlobalLogoutVersion();
  }

  private async initializeGlobalLogoutVersion(): Promise<void> {
    try {
      await this.settingsService.initializeGlobalLogoutVersion();
    } catch (error) {
      console.warn("Failed to initialize global logout version:", error);
    }
  }

  async loginAfterMfaVerification(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for email: ${email}`,
        userId: undefined,
        metadata: { email, reason: "User not found" },
        status: "FAILED",
        createdBy: undefined,
        errorMessage: "Invalid email or password",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("Invalid email or password");
    } else if (!user.is_active) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for user: ${user.email}`,
        userId: user._id,
        metadata: { email, reason: "User already deactivate" },
        status: "FAILED",
        createdBy: user._id,
        errorMessage: "User already deactivate",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("User already deactivate");
    }

    if (user.isMfaEnabled) {
      const log = {
        description: "LOGIN_MFA_REQUIRED",
        activityType: `User ${user.email} login requires MFA verification`,
        userId: user._id,
        metadata: { email: user.email, mfaRequired: true },
        status: "SUCCESS",
        createdBy: user._id,
      };
      await this.logService.logActivity(log);
      const expiredTokenSetting =
        await this.settingsService.getSettingByKey("expiredToken");
      const expiredTokenDuration =
        typeof expiredTokenSetting?.value === "number"
          ? expiredTokenSetting.value
          : Number(expiredTokenSetting?.value) || 1;
      const tempToken = await this.generateTempToken(
        user,
        expiredTokenDuration.toString() + "d",
      );
      return {
        token: tempToken,
        mfaRequired: true,
        refreshToken: await this.generateRefreshToken(user),
        expiredIn: Number(expiredTokenDuration),
        user,
        isNew: false,
        isMfaEnabled: true,
      };
    }

    const log = {
      description: "LOGIN_SUCCESS",
      activityType: `User ${user.email} logged in successfully`,
      userId: user._id,
      metadata: { email: user.email, loginTime: new Date() },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);
    const expiredTokenSetting =
      await this.settingsService.getSettingByKey("expiredToken");
    const expiredTokenDuration =
      typeof expiredTokenSetting?.value === "number"
        ? expiredTokenSetting.value
        : Number(expiredTokenSetting?.value) || 1;
    return {
      token: await this.generateJwtToken(
        user,
        expiredTokenDuration.toString() + "d",
      ),
      refreshToken: await this.generateRefreshToken(user),
      expiredIn: Number(expiredTokenDuration),
      user,
      isNew: false,
      isMfaEnabled: false,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for email: ${email}`,
        userId: undefined,
        metadata: { email, reason: "User not found" },
        status: "FAILED",
        createdBy: undefined,
        errorMessage: "Invalid email or password",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("Invalid email or password");
    } else if (!user.is_active) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for user: ${user.email}`,
        userId: user._id,
        metadata: { email, reason: "User already deactivate" },
        status: "FAILED",
        createdBy: user._id,
        errorMessage: "User already deactivate",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("User already deactivate");
    } else if (
      user.status === LectureStatus.WAITING_APPROVAL &&
      user.title === "Mentor"
    ) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for user: ${user.email}`,
        userId: user._id,
        metadata: { email, reason: `You account status is ${user.status}` },
        status: "FAILED",
        createdBy: user._id,
        errorMessage: `You account status is ${user.status}`,
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException(
        `You account status is ${user.status}, please contact our support team for more information`,
      );
    }

    const secret = Buffer.from(this.configService.HASH_SECRET);
    const isPasswordValid = await argon2.verify(
      user.password ?? "",
      password.trim(),
      { secret },
    );

    if (!isPasswordValid) {
      const log = {
        description: "LOGIN_FAILED",
        activityType: `Failed login attempt for user: ${user.email}`,
        userId: user._id,
        metadata: { email, reason: "Invalid password" },
        status: "FAILED",
        createdBy: user._id,
        errorMessage: "Invalid email or password",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.isMfaEnabled) {
      const log = {
        description: "LOGIN_MFA_REQUIRED",
        activityType: `User ${user.email} login requires MFA verification`,
        userId: user._id,
        metadata: { email: user.email, mfaRequired: true },
        status: "SUCCESS",
        createdBy: user._id,
      };
      await this.logService.logActivity(log);
      const expiredTokenSetting =
        await this.settingsService.getSettingByKey("expiredToken");
      const expiredTokenDuration =
        typeof expiredTokenSetting?.value === "number"
          ? expiredTokenSetting.value
          : Number(expiredTokenSetting?.value) || 1;
      const tempToken = await this.generateTempToken(
        user,
        expiredTokenDuration.toString() + "d",
      );
      return {
        token: tempToken,
        mfaRequired: true,
        refreshToken: await this.generateRefreshToken(user),
        expiredIn: Number(expiredTokenDuration),
        user,
        isNew: false,
        isMfaEnabled: true,
      };
    }

    const log = {
      description: "LOGIN_SUCCESS",
      activityType: `User ${user.email} logged in successfully`,
      userId: user._id,
      metadata: { email: user.email, loginTime: new Date() },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);
    const expiredTokenSetting =
      await this.settingsService.getSettingByKey("expiredToken");
    const expiredTokenDuration =
      typeof expiredTokenSetting?.value === "number"
        ? expiredTokenSetting.value
        : Number(expiredTokenSetting?.value) || 1;
    return {
      token: await this.generateJwtToken(
        user,
        expiredTokenDuration.toString() + "d",
      ),
      refreshToken: await this.generateRefreshToken(user),
      expiredIn: Number(expiredTokenDuration),
      user,
      isNew: false,
      isMfaEnabled: false,
    };
  }

  async generateTempToken(user: User, duration?: string): Promise<string> {
    const globalLogoutVersion =
      await this.settingsService.getGlobalLogoutVersion();
    const token = await this.jwtService.signAsync(
      { id: user._id, isGlobalLogOut: globalLogoutVersion, mfaPending: true },
      {
        expiresIn: duration,
        secret: this.configService.JWT_SECRET,
      },
    );
    return token;
  }

  async verifyMfaToken(userId: string, token: string): Promise<MfaResponse> {
    const user = await this.userService.findOneById(userId);
    if (!user || !user.mfaSecret) {
      const log = {
        description: "MFA_VERIFICATION_FAILED",
        activityType: `MFA verification failed for user: ${userId}`,
        userId: new ObjectId(userId),
        metadata: { reason: "MFA not enabled or configured" },
        status: "FAILED",
        createdBy: new ObjectId(userId),
        errorMessage: "MFA not enabled",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("MFA not enabled");
    }

    const isValid = this.mfaService.verifyToken(user.mfaSecret, token);
    if (!isValid) {
      const log = {
        description: "MFA_VERIFICATION_FAILED",
        activityType: `Invalid MFA token provided for user: ${user.email}`,
        userId: user._id,
        metadata: { email: user.email, reason: "Invalid token" },
        status: "FAILED",
        createdBy: user._id,
        errorMessage: "Invalid MFA token",
      };
      await this.logService.logActivity(log);
      throw new UnauthorizedException("Invalid MFA token");
    }

    const log = {
      description: "MFA_VERIFICATION_SUCCESS",
      activityType: `User ${user.email} successfully verified MFA`,
      userId: user._id,
      metadata: { email: user.email },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);

    const expiredTokenSetting =
      await this.settingsService.getSettingByKey("expiredToken");
    const expiredTokenDuration =
      typeof expiredTokenSetting?.value === "number"
        ? expiredTokenSetting.value
        : Number(expiredTokenSetting?.value) || 1;

    const accessToken = await this.generateJwtToken(
      user,
      expiredTokenDuration.toString() + "d",
    );

    const userUpdate = await this.userModel.findOneAndUpdate(
      { _id: user._id },
      { isMfaEnabled: true },
      { new: true },
    );

    if (!userUpdate) throw new BadRequestException("User not found");

    return {
      token: accessToken,
      isMfaEnabled: true,
      expiredIn: Number(expiredTokenDuration),
      user: userUpdate,
    };
  }

  async verify(token: string): Promise<TokenDto> {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const userResult: TokenDto = await this.jwtService.verifyAsync(
      tokenWithoutBearer,
      {
        secret: this.configService.JWT_SECRET,
      },
    );
    return userResult;
  }

  async generateJwtToken(user: User, duration?: string): Promise<string> {
    const globalLogoutVersion =
      await this.settingsService.getGlobalLogoutVersion();
    const token = await this.jwtService.signAsync(
      {
        id: user._id,
        isGlobalLogOut: globalLogoutVersion,
      },
      {
        expiresIn: duration ?? this.configService.JWT_EXPIRED,
        secret: this.configService.JWT_SECRET,
      },
    );
    return token;
  }

  async generateRefreshToken(user: User): Promise<string> {
    const token = await this.jwtService.signAsync(
      { id: user._id },
      {
        expiresIn: "60d",
        secret: this.configService.JWT_REFRESH_SECRET,
      },
    );
    return token;
  }

  async verifyRefreshToken(token: string): Promise<TokenDto> {
    const userResult: TokenDto = await this.jwtService.verifyAsync(token, {
      secret: this.configService.JWT_REFRESH_SECRET,
    });
    return userResult;
  }

  async generatePasswordResetToken(user: User): Promise<string> {
    const token = await this.jwtService.signAsync(
      {
        userId: user._id,
        purpose: "password_reset",
      },
      {
        expiresIn: "1h",
        secret: this.configService.JWT_SECRET + "_RESET",
      },
    );
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<{ userId: string }> {
    const payload = await this.jwtService.verifyAsync<{
      userId: string;
      purpose: string;
    }>(token, {
      secret: this.configService.JWT_SECRET + "_RESET",
    });

    if (payload.purpose !== "password_reset") {
      throw new UnauthorizedException("Invalid token purpose");
    }

    return { userId: payload.userId };
  }

  async logout(userId: string): Promise<boolean> {
    try {
      const user = await this.userService.findOneById(userId);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const log = {
        description: "LOGOUT_SUCCESS",
        activityType: `User ${user.email} logged out successfully`,
        userId: user._id,
        metadata: { email: user.email, logoutTime: new Date() },
        status: "SUCCESS",
        createdBy: user._id,
      };
      await this.logService.logActivity(log);

      return true;
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      const log = {
        description: "LOGOUT_FAILED",
        activityType: `Logout attempt failed`,
        userId: new ObjectId(userId),
        metadata: { error: errorMessage },
        status: "FAILED",
        createdBy: new ObjectId(userId),
        errorMessage: errorMessage,
      };
      await this.logService.logActivity(log);

      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async globalLogout(
    adminUserId: string,
  ): Promise<{ newVersion: string; message: string }> {
    try {
      const adminUser = await this.userService.findOneById(adminUserId);
      if (!adminUser) {
        throw new UnauthorizedException("Admin user not found");
      }

      const newVersion =
        await this.settingsService.incrementGlobalLogoutVersion();

      const log = {
        description: "GLOBAL_LOGOUT_SUCCESS",
        activityType: `Global logout initiated by admin ${adminUser.email}`,
        userId: adminUser._id,
        metadata: {
          adminEmail: adminUser.email,
          globalLogoutTime: new Date(),
          newGlobalVersion: newVersion,
        },
        status: "SUCCESS",
        createdBy: adminUser._id,
      };
      await this.logService.logActivity(log);

      return {
        newVersion,
        message: "All user tokens have been invalidated successfully",
      };
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      const log = {
        description: "GLOBAL_LOGOUT_FAILED",
        activityType: `Global logout attempt failed`,
        userId: new ObjectId(adminUserId),
        metadata: { error: errorMessage },
        status: "FAILED",
        createdBy: new ObjectId(adminUserId),
        errorMessage: errorMessage,
      };
      await this.logService.logActivity(log);

      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}
