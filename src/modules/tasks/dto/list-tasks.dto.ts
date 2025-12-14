import { Task } from 'libs/model/entities';
import { PaginationResponses } from 'src/common/decorators/pagination.response';

export class ListTasksResponse extends PaginationResponses {
  data: Task[];
}
