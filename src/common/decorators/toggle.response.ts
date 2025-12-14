import {
    IsString,
    IsNotEmpty
} from 'class-validator';
import { User } from 'libs/model/entities';

export class ToggleResponses {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsNotEmpty()
    actionBy: User;

    @IsString()
    @IsNotEmpty()
    action: string;
}
