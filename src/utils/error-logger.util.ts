import { BadRequestException } from "@nestjs/common";

export function handleError(e: unknown, context: string): void {
  if (e instanceof Error) {
    throw new BadRequestException(`${e}`);
  } else {
    throw new BadRequestException(`Unknown error occurred ${context}`);
  }
}
