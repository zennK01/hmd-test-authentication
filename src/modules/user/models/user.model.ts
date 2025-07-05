import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { UserRole, UserStatus } from '../enums';
import { BlackListRefreshToken } from '../interfaces';

@Table
export class User extends Model {
    @Column
    userName: string;

    @Column({ unique: true })
    email: string;

    @Column
    password: string;

    @Column({
        type: DataType.ENUM(...Object.values(UserRole).map(String)),
        defaultValue: UserRole.User
    })
    role: UserRole;

    @Column({
        type: DataType.ENUM(...Object.values(UserStatus).map(String)),
        defaultValue: UserStatus.Active
    })
    status: UserStatus;

    @Column({ type: DataType.TEXT('long') })
    refreshToken: string;

    @Column({ 
        type: DataType.JSON,
        allowNull: true,
        defaultValue: []
    })
    blackListRefreshToken: Array<BlackListRefreshToken>
}