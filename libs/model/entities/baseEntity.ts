import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ObjectId } from "mongodb";

export type BaseEntityDocument = HydratedDocument<BaseEntity>;

@Schema({ timestamps: true })
@ObjectType()
export class BaseEntity {
  @Field(() => ID)
  declare _id: ObjectId;

  @Prop({ default: true })
  @Field()
  is_active: boolean;

  @Prop({ default: false })
  @Field()
  is_deleted: boolean;

  @Prop({ required: false })
  @Field({ nullable: true })
  deletion_reason?: string;

  @Field()
  createdAt: Date;
}

export const BaseEntitySchema = SchemaFactory.createForClass(BaseEntity);
