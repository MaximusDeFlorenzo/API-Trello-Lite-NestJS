import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTasksInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  code?: string;

  @IsNotEmpty()
  project: string;

  @IsNotEmpty()
  status: string;

  @IsNotEmpty()
  assignee: string;
}