import { IsNotEmpty, IsString } from "class-validator";
import { CreateUserInput } from "./create-user.input";

export class UpdateUserInput extends CreateUserInput {
  @IsString()
  @IsNotEmpty()
  _id: string;
}
