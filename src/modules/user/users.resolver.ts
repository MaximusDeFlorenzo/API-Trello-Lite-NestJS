import { Query, Resolver, Args, Mutation } from "@nestjs/graphql";
import { JwtAuthGuard, Public } from "src/modules/auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { GetUserByIdInput } from "./dto/get-user-by-id.input";
import { CreateUserInput } from "./dto/create-user.input";
import { ComboboxUserInput } from "./dto/combobox-user.input";
import { ComboboxUserResponse } from "./dto/combobox-user-response.dto";
import { UpdateUserInput } from "./dto/update-user.input";
import { LoginResponse } from "./dto/login.response";
import { CurrentUser } from "../auth/current-user.context";
import { UseGuards, UseFilters, BadRequestException } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { ChangePasswordInput } from "./dto/change-password.input";
import { Me } from "./dto/me.dto";
import { GraphQLExceptionFilter } from "src/filters/graphql-exception.filter";
import { PermissionsGuard } from "../permission/permissions.guard";
import { Permissions } from "libs/decorators/permissions.decorator";
import { ListUsersResponse } from "./dto/list-users.response";
import { SoftDeleteUserInput } from "./dto/soft-delete-user.input";
import { mapUserToMe } from "./mapper/user-to-me.mapper";
import { LogActivity } from "../../interceptors/activity-logging.interceptor";
import { ListUsersInput } from "./dto/list-users.input";
import { MfaService } from "../auth/mfa.service";
import { MfaResponse } from "src/modules/user/dto/login-mfa.response";
import { MfaSetupResponse } from "./dto/mfa.response";
import { GlobalLogoutResponse } from "./dto/global-logout-response.dto";
import { User } from "libs/model/entities/user.entity";
import { Preference } from "libs/model/entities/preference.entity";

@Resolver(() => User)
export class UsersResolver {
  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  async updatePrivacyPolicyAgreement(
    @Args("acceptTerms") acceptTerms: boolean,
    @CurrentUser() currentUser: { user: User },
  ): Promise<User> {
    const userId = currentUser.user._id.toString();
    return this.userService.updatePrivacyPolicyAgreement(userId, acceptTerms);
  }
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) { }

  @UseFilters(GraphQLExceptionFilter)
  @LogActivity({
    activityType: "USER_REGISTER",
    description: "User registration",
    includeArgs: true,
  })
  @Mutation(() => User)
  @Public()
  async register(
    @Args("createUserInput") createUserInput: CreateUserInput,
  ): Promise<User> {
    const { email } = createUserInput;

    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) throw new BadRequestException("Email already exists");

    const user = await this.userService.create({
      ...createUserInput,
    });
    return user;
  }

  @LogActivity({
    activityType: "USER_LOGIN",
    description: "User login attempt",
  })
  @Mutation(() => LoginResponse)
  @Public()
  async login(
    @Args("email") email: string,
    @Args("password") password: string,
  ) {
    return await this.authService.login(email, password);
  }

  @Public()
  @Mutation(() => User)
  async forgotPassword(
    @Args("email") email: string,
    @Args("newPassword") newPassword: string,
  ): Promise<User> {
    return this.userService.forgotPassword(email, newPassword);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(JwtAuthGuard)
  async verifyMfaSetup(
    @CurrentUser() currentUser: { user: User; permissions: string[] },
    @Args("token") token: string,
  ) {
    if (!currentUser.user.mfaSecret) {
      throw new BadRequestException("MFA not setup yet");
    }

    const isValid = this.mfaService.verifyToken(
      currentUser.user.mfaSecret,
      token,
    );

    if (!isValid) {
      throw new BadRequestException(
        "Oops! Your OTP code has expired. Please request a new one",
      );
    }

    await this.userService.update(
      {
        isMfaEnabled: true,
      },
      currentUser,
    );

    return this.authService.loginAfterMfaVerification(currentUser.user.email);
  }

  @Mutation(() => MfaResponse)
  @Public()
  async verifyMfaLogin(
    @Args("tempToken") tempToken: string,
    @Args("token") token: string,
  ) {
    const decoded = await this.authService.verify(tempToken);
    return this.authService.verifyMfaToken(decoded.id, token);
  }

  @Mutation(() => MfaSetupResponse)
  @UseGuards(JwtAuthGuard)
  async setupMfa(
    @CurrentUser() currentUser: { user: User; permissions: string[] },
  ) {
    if (
      !currentUser.user.title.includes("Admin") &&
      !currentUser.user.title.includes("Mentor")
    )
      throw new BadRequestException("Only Admin and Mentor can enable MFA");
    if (currentUser.user.isMfaEnabled)
      throw new BadRequestException("MFA already enabled");

    const { secret, otpauthUrl } = this.mfaService.generateSecret(
      currentUser.user.email,
    );
    const qrCode = await this.mfaService.generateQRCode(otpauthUrl);
    await this.userService.update({ mfaSecret: secret }, currentUser);
    return {
      secret,
      qrCode,
    };
  }

  @Mutation(() => LoginResponse)
  async refreshToken(@Args("token") token: string) {
    const decoded = await this.authService.verifyRefreshToken(token);
    const user = await this.userService.findOneById(decoded.id);
    const newtoken = await this.authService.generateJwtToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    return {
      token: newtoken,
      refreshToken,
      user,
      isNew: false,
    } as LoginResponse;
  }

  @LogActivity({
    activityType: "USER_UPDATE",
    description: "User profile update",
    includeArgs: true,
  })
  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args("updateUserInput") updateUserInput: UpdateUserInput,
    @CurrentUser() currentUser: { user: User; permissions: string[] },
  ): Promise<User> {
    const { _id, preferences, ...updateData } = updateUserInput;
    const updateDataWithPreferences: Partial<User> = {
      ...updateData,
      ...(preferences && {
        preferences: preferences as unknown as Preference[],
        isChoosePreference: true,
      }),
    };
    return await this.userService.updateUser(
      _id,
      updateDataWithPreferences,
      currentUser,
    );
  }
  @LogActivity({
    activityType: "PASSWORD_CHANGE",
    description: "User password change",
  })
  @Mutation(() => User)
  async changePassword(
    @CurrentUser() user: User,
    @Args("changePasswordInput") changePasswordInput: ChangePasswordInput,
  ) {
    return this.userService.changePassword(
      user._id.toString(),
      changePasswordInput,
    );
  }

  @Query(() => User, { nullable: true })
  async getUserById(
    @Args("getUserByIdInput") getUserByIdInput: GetUserByIdInput,
  ): Promise<User> {
    return this.userService.findOneById(getUserByIdInput.id);
  }

  @Public()
  @Mutation(() => Boolean)
  async requestPasswordReset(
    @Args("email") email: string,
    @Args("type") type: string,
  ): Promise<boolean> {
    return this.userService.requestPasswordReset(email, type);
  }

  @Public()
  @Mutation(() => User)
  async resetPassword(
    @Args("token") token: string,
    @Args("newPassword") newPassword: string,
  ): Promise<User> {
    return this.userService.resetPassword(token, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Me)
  async getMe(@CurrentUser() currentUser: { user: User }): Promise<Me | null> {
    const { user } = currentUser;
    if (!user?._id) return null;
    const fullUser = await this.userService.findOneById(user._id.toString());

    return mapUserToMe(fullUser);
  }

  @UseFilters(GraphQLExceptionFilter)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("UserManagement:delete")
  @LogActivity({
    activityType: "USER_DELETE",
    description: "User soft delete",
    includeArgs: true,
  })
  @Mutation(() => User)
  async softDeleteUser(
    @Args("softDeleteUserInput") softDeleteUserInput: SoftDeleteUserInput,
  ): Promise<User> {
    return this.userService.softDelete(
      softDeleteUserInput.userId,
      softDeleteUserInput.reason,
    );
  }

  @UseFilters(GraphQLExceptionFilter)
  @UseGuards(JwtAuthGuard)
  @Query(() => ListUsersResponse)
  async listUsers(
    @CurrentUser() current: { user: User; permissions: string[] },
    @Args("Query") listUserInput: ListUsersInput,
  ): Promise<ListUsersResponse> {
    return this.userService.listUsers(
      listUserInput.type,
      listUserInput.page,
      listUserInput.limit,
      listUserInput.search,
      current.user._id,
      current.permissions,
    );
  }

  @Query(() => ComboboxUserResponse, { name: "comboboxUsers" })
  @UseGuards(JwtAuthGuard)
  async comboboxUsers(
    @Args("comboboxInput", { nullable: true }) comboboxInput: ComboboxUserInput,
    @CurrentUser() currentUser: { user: User; permissions: string[] },
  ): Promise<ComboboxUserResponse> {
    return this.userService.combobox(comboboxInput || {}, currentUser);
  }

  @LogActivity({
    activityType: "USER_LOGOUT",
    description: "User logout",
  })
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() currentUser: { user: User }): Promise<boolean> {
    return this.authService.logout(currentUser.user._id.toString());
  }

  @LogActivity({
    activityType: "GLOBAL_LOGOUT",
    description: "Global logout - invalidate all user tokens",
  })
  @Mutation(() => GlobalLogoutResponse)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("System:GlobalLogout")
  async globalLogout(
    @CurrentUser() currentUser: { user: User },
  ): Promise<GlobalLogoutResponse> {
    const result = await this.authService.globalLogout(
      currentUser.user._id.toString(),
    );
    return {
      success: true,
      newVersion: result.newVersion,
      message: result.message,
    };
  }
}
