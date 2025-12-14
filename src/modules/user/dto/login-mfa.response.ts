import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";

@ObjectType()
export class MfaResponse {
  @Field(() => String)
  token: string;

  @Field(() => Boolean)
  isMfaEnabled: boolean;

  @Field(() => Number)
  expiredIn: number;

  @Field(() => User)
  user: User;
}
