import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  token: string;

  @Field(() => String)
  refreshToken: string;

  @Field(() => User)
  user: User;

  @Field(() => Boolean)
  isNew: boolean;

  @Field(() => Number)
  expiredIn: number;

  @Field(() => Boolean)
  isMfaEnabled: boolean;
}
