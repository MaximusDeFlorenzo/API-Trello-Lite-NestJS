import { ObjectType, Field, ID } from "@nestjs/graphql";
import { ObjectId } from "mongodb";

@ObjectType()
export class Me {
  @Field(() => ID)
  declare _id: ObjectId;

  @Field()
  email: string;

  @Field({ nullable: true })
  full_name?: string;

  @Field({ nullable: true })
  phone_number?: string;

  @Field({ nullable: true })
  picture?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  gender: string;

  @Field({ nullable: true })
  linkedin: string;

  @Field({ nullable: true })
  birthDate: string;

  @Field({ nullable: true })
  ktp?: string;

  @Field({ nullable: true })
  ktpUrl?: string;

  @Field(() => [ID], { defaultValue: [] })
  favoriteClass?: ObjectId[];

  @Field({ nullable: true })
  isChoosePreference?: boolean;
}
