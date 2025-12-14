import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/current-user.context";
import { PermissionsGuard } from "../permission/permissions.guard";
import { User } from "libs/model/entities/user.entity";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("upload-image")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body("type") type: string,
    @Body("isSecret") isSecret: string,
    @CurrentUser() currentUser: { user: User },
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (!type) throw new BadRequestException("Type parameter is required");
    if (isSecret === undefined)
      throw new BadRequestException("IsSecret parameter is required");

    const isSecretBool = isSecret === "true";

    const allowedTypes = ["KTP", "NPWP", "IMAGE"];
    if (!allowedTypes.includes(type.toUpperCase())) {
      throw new BadRequestException(
        `Invalid type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimes.includes(file.mimetype))
      throw new BadRequestException(
        "Only JPEG, PNG, and JPG files are allowed",
      );

    return this.usersService.uploadImageFile(
      file,
      currentUser.user._id.toString(),
      currentUser.user,
      type,
      isSecretBool,
    );
  }

  @Get("image-url")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async getImageUrl(
    @Query("type") type: string,
    @Query("isSecret") isSecret: string,
    @CurrentUser() currentUser: { user: User },
  ) {
    if (!type) throw new BadRequestException("Type parameter is required");
    if (isSecret === undefined)
      throw new BadRequestException("IsSecret parameter is required");

    const isSecretBool = isSecret === "true";

    const allowedTypes = ["KTP", "NPWP", "IMAGE"];
    if (!allowedTypes.includes(type.toUpperCase())) {
      throw new BadRequestException(
        `Invalid type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    return {
      url: await this.usersService.getImageFileUrl(
        currentUser.user._id.toString(),
        type,
        isSecretBool,
      ),
    };
  }

  @Get("image-temporary-url")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async getImageTemporaryUrl(
    @Query("type") type: string,
    @Query("isSecret") isSecret: string,
    @CurrentUser() currentUser: { user: User },
  ) {
    if (!type) throw new BadRequestException("Type parameter is required");
    if (isSecret === undefined)
      throw new BadRequestException("IsSecret parameter is required");

    const isSecretBool = isSecret === "true";

    const allowedTypes = ["KTP", "NPWP", "IMAGE"];
    if (!allowedTypes.includes(type.toUpperCase())) {
      throw new BadRequestException(
        `Invalid type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    return {
      url: await this.usersService.getImageTemporaryUrl(
        currentUser.user._id.toString(),
        type,
        isSecretBool,
      ),
    };
  }

  @Delete("image")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async deleteImage(
    @Query("type") type: string,
    @Query("isSecret") isSecret: string,
    @CurrentUser() currentUser: { user: User },
  ) {
    if (!type) throw new BadRequestException("Type parameter is required");
    if (isSecret === undefined)
      throw new BadRequestException("IsSecret parameter is required");

    const isSecretBool = isSecret === "true";

    const allowedTypes = ["KTP", "NPWP", "IMAGE"];
    if (!allowedTypes.includes(type.toUpperCase())) {
      throw new BadRequestException(
        `Invalid type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    const deleted = await this.usersService.deleteImageFile(
      currentUser.user._id.toString(),
      type,
      isSecretBool,
    );
    return {
      success: deleted,
      message: `${type} file deleted successfully`,
    };
  }
}
