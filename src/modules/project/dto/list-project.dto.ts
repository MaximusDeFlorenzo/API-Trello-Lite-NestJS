import { Project } from 'libs/model/entities';
import { PaginationResponses } from 'src/common/decorators/pagination.response';

export class ListProjectResponse extends PaginationResponses {
  data: Project[];
}
