import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole } from "src/modules/user/enums";

export class RegisterUserRequestDto {
    
    @IsString()
    @IsNotEmpty()
    userName: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsEnum(UserRole)
    @IsOptional()
    role: UserRole
}