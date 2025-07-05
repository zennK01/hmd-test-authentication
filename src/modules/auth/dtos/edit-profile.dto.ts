import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserRole, UserStatus } from "src/modules/user/enums";

export class EditProfileUserRequestDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsOptional()
    password: string;

    @IsString()
    @IsOptional()
    userName: string;


    @IsEnum(UserRole)
    @IsOptional()
    role: UserRole;
    
    @IsEnum(UserStatus)
    @IsOptional()
    status: UserStatus;
}