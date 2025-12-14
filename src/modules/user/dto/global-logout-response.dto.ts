import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GlobalLogoutResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  newVersion: string;

  @Field(() => String)
  message: string;
}
