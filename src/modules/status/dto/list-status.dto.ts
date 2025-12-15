import { Status } from 'libs/model/entities';
import { PaginationResponses } from 'src/common/decorators/pagination.response';

export class ListStatusResponse extends PaginationResponses {
  data: Status[];
}
