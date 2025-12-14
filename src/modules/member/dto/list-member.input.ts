import { PartialType } from '@nestjs/mapped-types';
import { PaginationInput } from 'src/common/decorators/pagination.input';

export class ListMemberInput extends PartialType(PaginationInput) { }
