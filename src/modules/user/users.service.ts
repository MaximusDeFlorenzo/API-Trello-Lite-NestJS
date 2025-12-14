import {
  BadRequestException,
  Injectable,
  forwardRef,
  Inject,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FilterQuery, Model, Types } from "mongoose";
import { ObjectId } from "mongodb";
import { InjectModel } from "@nestjs/mongoose";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "../../config/config.service";
import { AuthService } from "../auth/auth.service";
import { CreateUserInput } from "./dto/create-user.input";
import { ChangePasswordInput } from "./dto/change-password.input";
import { ComboboxUserInput } from "./dto/combobox-user.input";
import { ComboboxUserResponse } from "./dto/combobox-user-response.dto";
import * as argon2 from "argon2";
import { handleError } from "src/utils/error-logger.util";
import { UserListFilter } from "libs/types/user-list-filter.enum";
import { LogService } from "../log/log.service";
import { MinioService } from "../minio/minio.service";
import "multer";
import { User, UserDocument } from "libs/model/entities/user.entity";
import { N8NService } from "../n8n";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userRepository: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    @Inject(forwardRef(() => LogService))
    private readonly logService: LogService,
    private readonly n8nService: N8NService,
    private readonly minioService: MinioService,
  ) { }

  async requestPasswordReset(email: string, type: string): Promise<boolean> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      const log = {
        description: "PASSWORD_RESET_FAILED",
        activityType: `Password reset requested for non-existent email: ${email}`,
        userId: undefined,
        metadata: { email, type, reason: "User not found" },
        status: "FAILED",
        createdBy: undefined,
        errorMessage: "User not found",
      };
      await this.logService.logActivity(log);
      return false;
    }

    const token = await this.authService.generatePasswordResetToken(user);
    const baseUrl = this.configService.WEBSITE_URL;
    const resetUrl =
      type === "requestForgotPassword"
        ? `${baseUrl}/reset-password?token=${token}`
        : `${baseUrl}/reset-password?token=${token}`;
    const subject =
      type === "requestForgotPassword"
        ? "Forgot Password Instructions"
        : "Reset Password Instructions";
    await this.mailerService.sendMail({
      to: user.email,
      subject: subject,
      template: "password-reset",
      context: {
        name: user.full_name,
        resetUrl,
        expiryHours: 1,
        type,
      },
    });

    const log = {
      description: "PASSWORD_RESET_REQUESTED",
      activityType: `Password reset email sent to user: ${user.email}`,
      userId: user._id,
      metadata: { email: user.email, type },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);

    return true;
  }

  async forgotPassword(email: string, newPassword: string): Promise<User> {
    const user = await this.findOneByEmail(email);
    if (!user) throw new BadRequestException("Email doesn't exist");

    this.validatePassword(newPassword);

    const secret = Buffer.from(this.configService.HASH_SECRET);
    const hashedPassword = await argon2.hash(newPassword, { secret });

    const updatedUser = await this.userRepository
      .findByIdAndUpdate(user, { password: hashedPassword }, { new: true })
      .select("-password");

    if (!updatedUser) throw new BadRequestException("User not found");

    const log = {
      description: "PASSWORD_FORGOT_CHANGED",
      activityType: `User ${user.email} changed password via forgot password`,
      userId: user._id,
      metadata: { email: user.email },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);

    return updatedUser;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const { userId } = await this.authService.verifyPasswordResetToken(token);

    if (newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters");
    }

    const secret = Buffer.from(this.configService.HASH_SECRET);
    const hashedPassword = await argon2.hash(newPassword, { secret });

    const updatedUser = await this.userRepository
      .findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
      .select("-password");

    if (!updatedUser) throw new BadRequestException("User not found");

    const log = {
      description: "PASSWORD_RESET_COMPLETED",
      activityType: `User completed password reset using token`,
      userId: updatedUser._id,
      metadata: { userId },
      status: "SUCCESS",
      createdBy: updatedUser._id,
    };
    await this.logService.logActivity(log);

    return updatedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }

  async findOneById(id: string): Promise<User> {
    try {
      const response = await this.userRepository
        .findById(new ObjectId(id) as any)
        .select("-password")
        .populate("permissions")
        .lean();
      if (!response) throw new Error("Failed to retrieve newly created user");

      if (response.picture) {
        response.picture = await this.getImageTemporaryUrl(
          id,
          "picture",
          false,
        );
      }
      return response;
    } catch (e) {
      handleError(e, "[UsersService][findOneById]");
      throw e;
    }
  }

  async find(query: FilterQuery<UserDocument>): Promise<User[]> {
    try {
      return await this.userRepository.find(query);
    } catch (e) {
      handleError(e, "[UsersService][find]");
      throw e;
    }
  }

  async findOneByUsername(username: string): Promise<User | null> {
    try {
      const response = await this.userRepository.findOne({
        username,
      });
      return response ?? null;
    } catch (e) {
      handleError(e, "[UsersService][findOneByUsername]");
      throw e;
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.userRepository.findOne({
        email,
      });
      return response ?? null;
    } catch (e) {
      handleError(e, "[UsersService][findOneByEmail]");
      throw e;
    }
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    try {
      const { email, full_name, ...rest } = createUserInput;
      const emailExist = await this.findOneByEmail(email);
      const username = `${full_name.replace(/\s+/g, "-").toLowerCase()}`;

      const existingUsername = await this.findOneByUsername(username);
      if (existingUsername)
        throw new BadRequestException("Username already exists");

      const generatedPassword = this.generatePassword();
      if (emailExist) throw new Error("Email is Already Registered");

      const secret = Buffer.from(this.configService.HASH_SECRET);
      const hash = await argon2.hash(generatedPassword, {
        secret,
      });

      const user = new this.userRepository({
        ...rest,
        permissions: createUserInput.permissions ?? [],
        email,
        full_name,
        password: hash,
        username,
      });

      await user.save();

      const baseUrl = this.configService.WEBSITE_URL;

      const userObject = user.toObject();
      const { ...userWithoutPassword } = userObject;
      const resetToken = await this.authService.generatePasswordResetToken(
        userWithoutPassword as unknown as User,
      );

      if (userWithoutPassword.title.includes("Mentor")) {
        await this.mailerService.sendMail({
          to: user.email,
          subject: "Welcome to EduMentor",
          template: "registration-template",
          context: {
            name: user.full_name,
            email: user.email,
            loginUrl: `${baseUrl}/setup-password?token=${resetToken}`,
            expiryHours: 1,
          },
        });

        this.n8nService.notAwaitSendWebhook(
          { _id: user._id, description: rest.description },
          "preference",
        );
      }
      const log = {
        description: "USER_CREATED",
        activityType: `New user created: ${userWithoutPassword.email}`,
        userId: userWithoutPassword._id,
        metadata: {
          email: userWithoutPassword.email,
          full_name: userWithoutPassword.full_name,
        },
        status: "SUCCESS",
        createdBy: userWithoutPassword._id,
      };
      await this.logService.logActivity(log);

      return userWithoutPassword as unknown as User;
    } catch (e) {
      handleError(e, "[UsersService][create]");
      throw e;
    }
  }

  async updatePrivacyPolicyAgreement(
    userId: string,
    acceptTerms: boolean,
  ): Promise<User> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error("User not found");

      user.isAcceptTerms = acceptTerms;
      user.privacy_policy_agreement_date = acceptTerms
        ? new Date().toISOString()
        : undefined;
      await user.save();
      return user;
    } catch (e) {
      handleError(e, "[UsersService][updatePrivacyPolicyAgreement]");
      throw e;
    }
  }

  async changePassword(
    userId: string,
    changePasswordInput: ChangePasswordInput,
  ): Promise<User> {
    try {
      const { currentPassword, newPassword } = changePasswordInput;
      const user = await this.userRepository.findById(new ObjectId(userId));
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const secret = Buffer.from(this.configService.HASH_SECRET);
      const isPasswordValid = await argon2.verify(
        user.password ?? "",
        currentPassword,
        { secret },
      );

      if (!isPasswordValid) {
        throw new BadRequestException("Current password is incorrect");
      }

      const newHash = await argon2.hash(newPassword, { secret });

      user.password = newHash;
      await user.save();

      const response = await this.userRepository
        .findById(user._id)
        .select("-password");
      if (!response) {
        throw new Error("Failed to retrieve updated user");
      }

      const log = {
        description: "PASSWORD_CHANGED",
        activityType: `User ${response.email} changed password`,
        userId: response._id,
        metadata: { userId: response._id.toString() },
        status: "SUCCESS",
        createdBy: response._id,
      };
      await this.logService.logActivity(log);
      return response;
    } catch (e) {
      handleError(e, "[UsersService][changePassword]");
      throw e;
    }
  }

  async update(
    data: Partial<User>,
    currentUser: { user: User; permissions: string[] },
  ): Promise<User> {
    try {
      const updatedUser = await this.userRepository
        .findByIdAndUpdate(currentUser.user._id, data, { new: true })
        .select("-password")
        .populate("permissions");

      if (!updatedUser) throw new Error("Failed to retrieve updated user");

      const log = {
        description: "USER_UPDATED",
        activityType: `User ${updatedUser.email} updated their profile`,
        userId: updatedUser._id,
        metadata: { userId: updatedUser._id.toString(), changes: data },
        status: "SUCCESS",
        createdBy: updatedUser._id,
      };
      await this.logService.logActivity(log);

      return updatedUser;
    } catch (e) {
      handleError(e, "[UsersService][update]");
      throw e;
    }
  }

  async updateUser(
    userId: string,
    data: Partial<User>,
    currentUser: { user: User; permissions: string[] },
  ): Promise<User> {
    try {
      const isUpdatingSelf = currentUser.user._id.toString() === userId;
      const hasAdminPrivileges = currentUser.user.title.includes("Admin");

      if (!isUpdatingSelf && !hasAdminPrivileges)
        throw new BadRequestException(
          "You do not have permission to update this user.",
        );

      const updatedUser = await this.userRepository
        .findByIdAndUpdate(new ObjectId(userId), data, { new: true })
        .select("-password")
        .populate("permissions");

      if (!updatedUser) throw new Error("Failed to retrieve updated user");

      const log = {
        description: "USER_UPDATED",
        activityType: `User ${updatedUser.email} updated by ${currentUser.user.email}`,
        userId: updatedUser._id,
        metadata: {
          userId: updatedUser._id.toString(),
          changes: data,
          updatedBy: currentUser.user._id.toString(),
        },
        status: "SUCCESS",
        createdBy: currentUser.user._id,
      };
      await this.logService.logActivity(log);

      return updatedUser;
    } catch (e) {
      handleError(e, "[UsersService][updateUser]");
      throw e;
    }
  }

  async verifyRefreshToken(token: string): Promise<User> {
    try {
      const decoded = await this.authService.verify(token);

      const user = await this.userRepository.findOne({
        _id: new Types.ObjectId(decoded.id),
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (e) {
      handleError(e, "[UsersService][verifyRefreshToken]");
      throw e;
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.verifyRefreshToken(refreshToken);
    const newAccessToken = await this.authService.generateJwtToken(user);

    const log = {
      description: "TOKEN_REFRESHED",
      activityType: `User ${user.email} refreshed their access token`,
      userId: user._id,
      metadata: { email: user.email },
      status: "SUCCESS",
      createdBy: user._id,
    };
    await this.logService.logActivity(log);

    return { accessToken: newAccessToken, refreshToken };
  }

  async softDelete(userId: string, reason?: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(new ObjectId(userId));
      if (!user) throw new BadRequestException("User not found");

      if (user.is_active)
        throw new BadRequestException("User is already deleted");

      const updatedUser = await this.userRepository
        .findByIdAndUpdate(
          userId,
          {
            is_active: false,
            deletedAt: new Date(),
            reason_delete: reason ?? "User deleted",
            updatedAt: new Date(),
          },
          { new: true },
        )
        .select("-password");

      if (!updatedUser) throw new BadRequestException("Failed to delete user");

      const log = {
        description: "USER_SOFT_DELETED",
        activityType: `User ${updatedUser.email} was soft deleted`,
        userId: updatedUser._id,
        metadata: {
          userId: updatedUser._id.toString(),
          reason,
          email: updatedUser.email,
        },
        status: "SUCCESS",
        createdBy: updatedUser._id,
      };
      await this.logService.logActivity(log);

      return updatedUser;
    } catch (e) {
      handleError(e, "[UsersService][softDelete]");
      throw e;
    }
  }

  async listUsers(
    listType: UserListFilter,
    page: number = 1,
    limit: number = 10,
    search?: string,
    currentUserId?: string | ObjectId,
    userPermissions?: string[],
  ) {
    try {
      const permissionCheck = this.checkUserPermissions(
        listType,
        currentUserId,
        userPermissions,
      );

      if (permissionCheck) return permissionCheck;

      const skip = (page - 1) * limit;

      const query: FilterQuery<User> = this.buildUserFilter(
        listType,
        search,
        currentUserId,
        userPermissions,
      );

      const [users, totalCount] = await Promise.all([
        this.userRepository
          .find(query)
          .select("-password")
          .populate("permissions")
          .skip(skip)
          .limit(limit)
          .sort({ updatedAt: -1 }),
        this.userRepository.countDocuments(query),
      ]);

      return this.buildPaginatedResponse(users, totalCount, page, limit);
    } catch (e) {
      handleError(e, "[UsersService][listUsers]");
      throw e;
    }
  }

  private buildPaginatedResponse(
    users: User[],
    totalCount: number,
    page: number,
    limit: number,
  ) {
    const totalPages = Math.ceil(totalCount / limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private generatePassword(): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  private async sendWelcomeEmail(
    email: string,
    name: string,
    password: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: "Welcome to Our Platform",
        template: "welcome",
        context: {
          name,
          email,
          password,
          loginUrl: `${this.configService.WEBSITE_URL}/login`,
        },
      });
    } catch (e) {
      handleError(e, "[UsersService][sendWelcomeEmail]");
      throw e;
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8)
      throw new BadRequestException(
        "Password must be at least 8 characters long",
      );
    if (!/[a-z]/.test(password))
      throw new BadRequestException(
        "Password must contain at least one lowercase letter",
      );
    if (!/[A-Z]/.test(password))
      throw new BadRequestException(
        "Password must contain at least one uppercase letter",
      );
    if (!/\d/.test(password))
      throw new BadRequestException("Password must contain at least one digit");

    const validSymbols = /[!$%&'()*+,/;<=>?「」^{}~]/;
    if (!validSymbols.test(password))
      throw new BadRequestException(
        "Password must contain at least one valid symbol: !$%&'()*+,/;<=>?「」^{}~",
      );

    const validChars = /^[a-zA-Z0-9!$%&'()*+,/;<=>?「」^{}~]+$/;
    if (!validChars.test(password))
      throw new BadRequestException(
        "Password contains invalid characters. Only letters, numbers, and symbols are allowed",
      );
  }

  async uploadImageFile(
    file: Express.Multer.File,
    userId: string,
    user: User,
    type: string,
    isSecret: boolean,
  ): Promise<{ success: boolean }> {
    try {
      const filename = await this.minioService.uploadImageFile(
        file,
        userId,
        type,
        isSecret,
      );

      const updateField = type.toLowerCase();
      await this.userRepository.findByIdAndUpdate(userId, {
        [updateField]: filename,
      });

      const log = {
        description: `${type.toUpperCase()}_UPLOADED`,
        activityType: `User ${user.email} uploaded ${type} file`,
        userId: user._id,
        metadata: { filename, userId, type, isSecret },
        status: "SUCCESS",
        createdBy: user._id,
      };
      await this.logService.logActivity(log);

      return { success: true };
    } catch (e) {
      handleError(e, "[UsersService][uploadImageFile]");
      throw e;
    }
  }

  async getImageFileUrl(
    userId: string,
    type: string,
    isSecret: boolean,
  ): Promise<string> {
    try {
      const user = await this.userRepository.findById(new ObjectId(userId));
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const fieldName = type.toLowerCase();
      const filename = user[fieldName as keyof typeof user] as string;

      if (!filename) {
        throw new BadRequestException(`No ${type} file found for this user`);
      }

      return await this.minioService.getImageFileUrl(filename, isSecret);
    } catch (e) {
      handleError(e, "[UsersService][getImageFileUrl]");
      throw e;
    }
  }

  async getImageTemporaryUrl(
    userId: string,
    type: string,
    isSecret: boolean,
  ): Promise<string> {
    try {
      const user = await this.userRepository.findById(new ObjectId(userId));
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const fieldName = type.toLowerCase();
      const filename = user[fieldName as keyof typeof user] as string;

      if (!filename) {
        throw new BadRequestException(`No ${type} file found for this user`);
      }

      return await this.minioService.getImageTemporaryUrl(filename, isSecret);
    } catch (e) {
      handleError(e, "[UsersService][getImageTemporaryUrl]");
      throw e;
    }
  }

  async deleteImageFile(
    userId: string,
    type: string,
    isSecret: boolean,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(new ObjectId(userId));
      if (!user) {
        throw new BadRequestException("User not found");
      }

      const fieldName = type.toLowerCase();
      const filename = user[fieldName as keyof typeof user] as string;

      if (!filename) {
        throw new BadRequestException(`No ${type} file found for this user`);
      }

      await this.minioService.deleteImageFile(filename, isSecret);
      await this.userRepository.findByIdAndUpdate(userId, {
        $unset: { [fieldName]: 1 },
      });

      const log = {
        description: `${type.toUpperCase()}_DELETED`,
        activityType: `User ${user.email} deleted ${type} file`,
        userId: user._id,
        metadata: { userId, type },
        status: "SUCCESS",
        createdBy: user._id,
      };
      await this.logService.logActivity(log);

      return true;
    } catch (e) {
      handleError(e, "[UsersService][deleteImageFile]");
      throw e;
    }
  }

  private checkUserPermissions(
    listType: UserListFilter,
    currentUserId?: string | ObjectId,
    userPermissions?: string[],
  ) {
    if (!currentUserId || !userPermissions) return null;

    const hasViewActiveUsers = userPermissions.includes(
      "UserManagement:ViewActiveUsers",
    );
    const hasViewInactiveUsers = userPermissions.includes(
      "UserManagement:ViewInactiveUsers",
    );
    const hasViewDeletedUsers = userPermissions.includes(
      "UserManagement:ViewDeletedUsers",
    );

    const requiredPermission = {
      [UserListFilter.ACTIVE]: hasViewActiveUsers,
      [UserListFilter.INACTIVE]: hasViewInactiveUsers,
      [UserListFilter.DELETED]: hasViewDeletedUsers,
    }[listType];

    if (!requiredPermission)
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);

    return null;
  }

  private buildUserFilter(
    listType: UserListFilter,
    search?: string,
    currentUserId?: string | ObjectId,
    userPermissions?: string[],
  ): FilterQuery<User> {
    const query: FilterQuery<User> = (() => {
      switch (listType) {
        case UserListFilter.ACTIVE:
          return {
            is_delete: false,
            is_active: true,
            title: { $ne: "Customer" },
          };
        case UserListFilter.INACTIVE:
          return {
            is_delete: false,
            is_active: false,
            title: { $ne: "Customer" },
          };
        case UserListFilter.DELETED:
          return { is_delete: true, title: { $ne: "Customer" } };
        default:
          return { title: { $ne: "Customer" } };
      }
    })();

    this.applyPermissionFilter(query, currentUserId, userPermissions);

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    return query;
  }

  private applyPermissionFilter(
    query: FilterQuery<User>,
    currentUserId?: string | ObjectId,
    userPermissions?: string[],
  ): void {
    if (!currentUserId || !userPermissions) {
      return;
    }

    const hasViewActiveUsers = userPermissions.includes(
      "UserManagement:ViewActiveUsers",
    );
    const hasViewInactiveUsers = userPermissions.includes(
      "UserManagement:ViewInactiveUsers",
    );
    const hasViewDeletedUsers = userPermissions.includes(
      "UserManagement:ViewDeletedUsers",
    );

    if (!hasViewActiveUsers && !hasViewInactiveUsers && !hasViewDeletedUsers)
      query._id = new Types.ObjectId(currentUserId.toString());
  }

  async combobox(
    comboboxInput: ComboboxUserInput,
    currentUser: { user: User; permissions: string[] },
  ): Promise<ComboboxUserResponse> {
    try {
      const { search, limit = 50, page = 1, isCustomer } = comboboxInput;
      const skip = (page - 1) * limit;

      const hasAdminPrivileges =
        currentUser.user.title && currentUser.user.title.includes("Admin");

      interface UserFilter {
        $or?: Array<{
          full_name?: { $regex: string; $options: string };
          email?: { $regex: string; $options: string };
          username?: { $regex: string; $options: string };
        }>;
        is_active?: boolean;
        is_delete?: boolean;
        _id?: ObjectId;
        customer?: { $exists: boolean } | { $ne: null };
      }

      const filter: UserFilter = {
        is_active: true,
        is_delete: false,
      };

      if (!hasAdminPrivileges) filter._id = currentUser.user._id;
      if (isCustomer !== undefined && isCustomer)
        filter.customer = { $ne: null };

      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        this.userRepository
          .find(filter)
          .select("_id full_name email username")
          .populate("customer", "name")
          .sort({ full_name: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userRepository.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map((user) => ({
          value: user._id.toString(),
          label: user.full_name,
        })),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (e) {
      handleError(e, "[UsersService][combobox]");
      throw e;
    }
  }
}
