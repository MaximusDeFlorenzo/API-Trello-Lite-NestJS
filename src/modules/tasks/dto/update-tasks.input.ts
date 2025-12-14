import { CreateTasksInput } from "./create-tasks.input";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateTasksInput extends PartialType(CreateTasksInput) {
}
