import { Exclude, Expose } from "class-transformer";

@Exclude()
export class GetProfileUserResponseDto {

    @Expose()
    userName: string;

    @Expose()
    email: string;

    @Expose()
    role: string;

    @Expose()
    status: string;

}