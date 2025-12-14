import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator";
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateUserInput {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  picture?: string;

  @Field(() => String, { nullable: true })
  full_name?: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  phone_number?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  province?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  linkedin?: string;

  @Field(() => String, { nullable: true })
  birthDate?: string;

  @Field(() => String, { nullable: true })
  gender?: string;

  @Field(() => Boolean, { nullable: true })
  acceptTerms?: boolean;

  @Field(() => [String], { nullable: true })
  preferences?: string[];
}

export class SaveUpdateUserInput {
  @IsNotEmpty()
  _id?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}
