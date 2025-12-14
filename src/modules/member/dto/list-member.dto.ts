import { Member } from 'libs/model/entities';
import { PaginationResponses } from 'src/common/decorators/pagination.response';

export class ListMemberResponse extends PaginationResponses {
  data: Member[];
}
