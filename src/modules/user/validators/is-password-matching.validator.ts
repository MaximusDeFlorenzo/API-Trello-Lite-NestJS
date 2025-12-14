import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ChangePasswordInput } from "../dto/change-password.input";

@ValidatorConstraint({ name: "IsPasswordMatching", async: false })
export class IsPasswordMatchingConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments): boolean {
    const object = args.object as ChangePasswordInput;
    return value !== object.currentPassword;
  }

  defaultMessage(): string {
    return "Password baru tidak boleh sama dengan password lama";
  }
}
