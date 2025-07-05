import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories';
import { HashingService } from '../hashing/hashing.service';
import { User } from './models';
import { UserRole, UserStatus } from './enums';

@Injectable()
export class UserService {

    constructor(
        private readonly userRepository: UserRepository,
        private readonly hashingService: HashingService,
    ) { }

    async createUser(params: { userName: string; email: string; password: string; role?: UserRole; status?: UserStatus }) {
        const { userName, email, password, role, status } = params;
        const passwordHashed = await this.hashingService.hashPassword(password);
        const user = await this.userRepository.createUser({ userName, email, password: passwordHashed, role, status });
        return user;
    }

    async findOneUserById(param: { userId: string }) {
        return await this.userRepository.findOneUser({ id: param.userId });
    }

    async findOneUser(params: { email: string }) {
        const { email } = params;
        const userFound = await this.userRepository.findOneUser({ email });
        return userFound;
    }

    async updateUser(params: { query: Partial<User>, updateData: Partial<User> }) {
        const { query, updateData } = params;
        const updatedRefreshUser = await this.userRepository.findOneAndUpdate(query, updateData);
        return updatedRefreshUser;
    }

    async addToBlacklist(params: { userId: string; refreshToken: string; reason: string }) {
        const { userId, refreshToken, reason = 'logout' } = params;
        const user = await this.userRepository.findOneUser({ id: userId });
        if (!user) return;

        const blacklistEntry = {
            token: refreshToken,
            reason
        };

        const currentBlacklist = user.blackListRefreshToken || [];
        currentBlacklist.push(blacklistEntry);

        return await this.userRepository.findOneAndUpdate({ id: userId }, { blackListRefreshToken: currentBlacklist })
    }

    async isTokenBlacklist(userId: string, refreshToken: string) {
        const user = await this.userRepository.findOneUser({ id: userId });
        if (!user || !user.blackListRefreshToken.length) return false;

        return user.blackListRefreshToken.some((entry) => entry.token === refreshToken);
    }
}
