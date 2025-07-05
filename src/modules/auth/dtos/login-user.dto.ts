import { IsNotEmpty, IsString } from "class-validator";

export class LoginUserRequestDto {

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}