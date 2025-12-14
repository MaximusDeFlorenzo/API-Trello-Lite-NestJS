import { Field, InputType, Int } from "@nestjs/graphql";
import {
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  Max,
  Min,
  IsBoolean,
} from "class-validator";

@InputType()
export class ComboboxUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Search query must be at least 1 character long" })
  search?: string;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isCustomer?: boolean;
}
