import { PartialType } from '@nestjs/mapped-types';
import { PaginationInput } from 'src/common/decorators/pagination.input';

export class ListUserInput extends PartialType(PaginationInput) { }
