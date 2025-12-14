import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;
}