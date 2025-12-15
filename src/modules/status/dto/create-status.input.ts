import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStatusInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  sequence: number;

  @IsNotEmpty()
  project: string;
}