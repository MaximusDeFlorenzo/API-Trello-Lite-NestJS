import { ObjectType, Field } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";

@ObjectType()
export class LoginResponse {
  @Field()
  token: string;

  @Field()
  refreshToken: string;

  @Field(() => User)
  user: User;

  @Field()
  isNew: boolean;
}
