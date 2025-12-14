import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateUserWithRoleInput {
  @Field()
  username: string;

  @Field()
  full_name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone_number?: string;
}
