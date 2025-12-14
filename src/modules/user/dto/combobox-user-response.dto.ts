import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserComboboxItem {
  @Field()
  value: string;

  @Field()
  label: string;
}

@ObjectType()
export class ComboboxUserResponse {
  @Field(() => [UserComboboxItem])
  users: UserComboboxItem[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}
