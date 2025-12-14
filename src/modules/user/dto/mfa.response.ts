import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class MfaSetupResponse {
  @Field()
  secret: string;

  @Field()
  qrCode: string;
}
