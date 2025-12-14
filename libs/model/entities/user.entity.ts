import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Field, ObjectType } from "@nestjs/graphql";
import { Entity } from "typeorm";
import { Permission } from "./permission.entity";
import { Preference } from "./preference.entity";
import { Report } from "./report.entity";
import { LectureStatus } from "libs/types/lecture.type";
import { ObjectId } from "mongodb";
import { BaseEntity } from "./baseEntity";
import { Class } from "./class.entity";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
@Entity("users")
@ObjectType()
export class User extends BaseEntity {
  @Prop({ required: true, type: "string", length: 250 })
  @Field()
  full_name: string;

  @Prop({ required: true, type: "string", length: 250 })
  @Field()
  username: string;

  @Prop({ required: true, unique: true })
  @Field()
  email: string;

  @Prop({ required: true })
  @Field()
  title: string;

  @Field()
  @Prop({ nullable: true })
  password?: string;

  @Field()
  @Prop({ nullable: true })
  description?: string;

  @Prop({ type: "string", nullable: true })
  @Field({ nullable: true })
  phone_number?: string;

  @Prop({ enum: LectureStatus, default: LectureStatus.WAITING_APPROVAL })
  @Field(() => LectureStatus)
  status: LectureStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: Permission.name }], default: [] })
  @Field(() => [Permission], { nullable: true })
  permissions: Permission[];

  @Prop({ type: [{ type: Types.ObjectId, ref: Report.name }], default: [] })
  @Field(() => [Report], { nullable: true })
  reports?: Report[];

  @Prop({ required: true, type: "boolean", default: false })
  @Field()
  isAcceptTerms: boolean;

  @Field({ nullable: true })
  @Prop({ nullable: true })
  privacy_policy_agreement_date?: string;

  @Field({ nullable: true })
  @Prop({ nullable: true })
  picture: string;

  @Field({ nullable: true })
  @Prop({ nullable: true })
  gender: string;

  @Field({ nullable: true })
  @Prop({ nullable: true })
  linkedin: string;

  @Field({ nullable: true })
  @Prop({ nullable: true })
  birthDate: string;

  @Prop({ type: "string", nullable: true })
  @Field()
  reason_delete: string;

  @Prop({ type: "boolean", default: false })
  @Field()
  isChoosePreference: boolean;

  @Prop({ type: "boolean", default: false })
  @Field()
  isMfaEnabled: boolean;

  @Prop({ type: "string", nullable: true })
  @Field({ nullable: true })
  mfaSecret?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Preference" }], default: [] })
  @Field(() => [Preference])
  preferences?: Preference[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "Class" }], default: [] })
  @Field(() => [Class], { nullable: true })
  favoriteClass?: ObjectId[];

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  @Field(() => User, { nullable: true })
  approvedBy?: ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  @Field(() => User, { nullable: true })
  createdBy?: ObjectId;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  @Field(() => User, { nullable: true })
  updatedBy?: ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
