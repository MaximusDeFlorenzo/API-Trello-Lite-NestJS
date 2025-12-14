import { Field, ID, InputType } from "@nestjs/graphql";

@InputType()
export class GetUserByIdInput {
  @Field(() => ID)
  id: string;
}
