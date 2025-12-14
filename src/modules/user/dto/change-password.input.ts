import { InputType, Field } from "@nestjs/graphql";
import { IsNotEmpty, MinLength, MaxLength, Validate } from "class-validator";
import { IsPasswordMatchingConstraint } from "../validators/is-password-matching.validator";

@InputType()
export class ChangePasswordInput {
  @Field(() => String)
  @IsNotEmpty()
  currentPassword: string;

  @Field(() => String)
  @IsNotEmpty()
  @MinLength(8, { message: "Password minimal 8 karakter" })
  @MaxLength(32, { message: "Password maksimal 32 karakter" })
  @Validate(IsPasswordMatchingConstraint, {
    message: "Password baru tidak boleh sama dengan password lama",
  })
  newPassword: string;
}
