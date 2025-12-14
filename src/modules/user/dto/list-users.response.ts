import { Field, ObjectType, PartialType } from "@nestjs/graphql";
import { User } from "libs/model/entities/user.entity";
import { PaginationResponses } from "../../log/dto/pagination.response";

@ObjectType()
export class ListUsersResponse extends PartialType(PaginationResponses) {
  @Field(() => [User])
  users: User[];
}
