import { PartialType } from "@nestjs/mapped-types";
import { CreateStatusInput } from "./create-status.input";

export class UpdateStatusInput extends PartialType(CreateStatusInput) {
}
