import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class SoftDeleteUserInput {
  @Field()
  userId: string;

  @Field({ nullable: true })
  reason?: string;
}
