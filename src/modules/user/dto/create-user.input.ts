import { Field, InputType } from "@nestjs/graphql";
import { Prop } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  full_name: string;

  @Field(() => String)
  title: string;

  @Prop({ type: [{ type: ObjectId, ref: "Role" }], default: [] })
  @Field(() => [String], { nullable: true })
  roles: string[];

  @Prop({ type: [{ type: ObjectId, ref: "Permission" }], default: [] })
  @Field(() => [String], { nullable: true })
  permissions: string[];

  @Field(() => String, { nullable: true })
  phone_number?: string;

  @Field(() => String, { nullable: true })
  password?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  province?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => Date, { nullable: true })
  birthDate?: Date;

  @Field(() => String, { nullable: true })
  gender?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  picture?: string;

  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => String, { nullable: true })
  headline?: string;

  @Field(() => String, { nullable: true })
  website?: string;

  @Field(() => String, { nullable: true })
  linkedin?: string;

  @Field(() => String, { nullable: true })
  github?: string;

  @Field(() => String, { nullable: true })
  customer?: string;

  @Field(() => String, { nullable: true })
  ktp?: string;

  @Field(() => Boolean, { nullable: true })
  acceptTerms?: boolean;
}
