import { User } from 'libs/model/entities';
import { PaginationResponses } from 'src/common/decorators/pagination.response';

export class ListUserResponse extends PaginationResponses {
  data: User[];
}
