import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class SearchUsersInput {
  @Field(() => String, { nullable: true })
  keyword?: string;
}
