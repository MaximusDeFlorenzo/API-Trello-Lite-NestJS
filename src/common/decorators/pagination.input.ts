import {
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  page?: number;

  @IsNumber()
  @Max(1000000)
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
