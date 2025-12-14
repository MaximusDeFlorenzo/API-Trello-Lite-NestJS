import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMemberInput {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsOptional()
  is_admin?: boolean;
}