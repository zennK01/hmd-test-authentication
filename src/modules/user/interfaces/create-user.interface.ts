import { UserRole, UserStatus } from "../enums";

export interface CreateUserInterface {
    userName: string;
    email: string;
    password: string;
    role?: UserRole;
    status?: UserStatus;
}