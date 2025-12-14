import { UserListFilter } from "libs/types/user-list-filter.enum";
import { PaginationInput } from "../../log/dto/pagination.input";
import {
  Field,
  InputType,
  PartialType,
  registerEnumType,
} from "@nestjs/graphql";

registerEnumType(UserListFilter, {
  name: "UserListType",
  description: "Types of user lists based on status",
});

@InputType()
export class ListUsersInput extends PartialType(PaginationInput) {
  @Field(() => UserListFilter)
  type: UserListFilter;
}
