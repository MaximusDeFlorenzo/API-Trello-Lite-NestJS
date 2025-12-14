import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class KtpUploadResponse {
  @Field()
  filename: string;

  @Field()
  url: string;

  @Field()
  message: string;
}
