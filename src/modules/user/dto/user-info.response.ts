import { Field, ObjectType, ID } from "@nestjs/graphql";
import { ObjectId } from "mongodb";

@ObjectType()
export class UserInfoResponse {
  @Field(() => String, { nullable: true })
  full_name?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  phone_number?: string;

  @Field(() => String, { nullable: true })
  picture?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => ID)
  _id: ObjectId;
}
