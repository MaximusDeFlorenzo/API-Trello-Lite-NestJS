import { PartialType } from '@nestjs/swagger';
import { PaginationInput } from 'src/common/decorators/pagination.input';

export class ListUserInput extends PartialType(PaginationInput) { }
