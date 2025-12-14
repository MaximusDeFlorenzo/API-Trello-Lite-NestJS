import { registerEnumType } from "@nestjs/graphql";

export enum UserListFilter {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
}

registerEnumType(UserListFilter, { name: "UserListFilter" });
