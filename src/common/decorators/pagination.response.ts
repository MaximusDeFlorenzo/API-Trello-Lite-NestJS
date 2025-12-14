import {
  IsNumber,
  IsOptional,
} from 'class-validator';

export class PaginationResponses {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsNumber()
  totalPages?: number;
}
