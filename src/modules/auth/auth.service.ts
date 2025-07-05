import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { HashingService } from '../hashing/hashing.service';
import { generateKeyPairSync } from 'crypto';
import { KeyTokenService } from '../key-token/key-token.service';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { GetProfileUserResponseDto } from './dtos';
import { UserRole, UserStatus } from '../user/enums';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly hashingService: HashingService,
        private readonly keyTokenService: KeyTokenService,
        private jwtService: JwtService,

    ) { }

    async registerUser(request: { userName: string; email: string; password: string; role?: UserRole }) {
        const { userName, email, password, role } = request;
        try {
            await this.userService.createUser({
                userName,
                email,
                password,
                role
            })

            return {
                code: HttpStatus.OK,
                message: "success",
            }
        } catch (error) {
            throw new HttpException("register user failed", HttpStatus.INTERNAL_SERVER_ERROR, {
                cause: {
                    status: HttpStatus.INTERNAL_SERVER_ERROR
                }
            })
        }
    }

    async login(request: { email: string; password: string }) {
        const { email, password } = request;

        const userExist = await this.userService.findOneUser({ email });

        if (!userExist) {
            throw new NotFoundException("user_not_found");
        }

        const isCorrectPassword = await this.hashingService.comparePassword(password, userExist.password)
        if (!isCorrectPassword) {
            throw new BadRequestException("password_incorrect")
        }

        const { publicKey, privateKey } = await generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" }
        })

        const token = await this.keyTokenService.createTokenPairs(userExist.email, privateKey, publicKey, userExist.id);
        if (!token) {
            throw new BadRequestException("create_token_failed")
        }

        await this.userService.updateUser({
            query: { email: userExist.email },
            updateData: { refreshToken: token.refreshToken }
        });
        return {
            code: HttpStatus.OK,
            message: "success",
            data: {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken
            }
        }
    }

    async refreshToken(request: { refreshToken: string }) {
        const { refreshToken } = request;

        const { publicKey, email, userId } = await this.jwtService.decode(refreshToken);

        const user = await this.userService.findOneUser({ email });
        if (!user || !user.refreshToken) {
            throw new BadRequestException("invalid_request");
        }

        const isInBlacklistToken = await this.userService.isTokenBlacklist(userId, refreshToken);
        if(isInBlacklistToken){
            throw new BadRequestException("invalid_request");
        }

        try {
            await this.jwtService.verifyAsync(refreshToken, {
                publicKey,
                algorithms: ["RS256"]
            })

        } catch (error) {

            await this.userService.updateUser({
                query: { email },
                updateData: { refreshToken: "" }
            })
            throw new BadRequestException("expire_key");

        }

        const { publicKey: newPublickey, privateKey: newPrivateKey } = generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" }
        })


        const token = await this.keyTokenService.createTokenPairs(email, newPrivateKey, newPublickey, userId);
        if (!token) {
            throw new BadRequestException("create_token_failed")
        }

        await this.userService.updateUser({
            query: { email },
            updateData: { refreshToken: token.refreshToken }
        });

        return {
            code: HttpStatus.OK,
            message: "success",
            data: {
                accessToken: token.accessToken,
                refreshToken: token.refreshToken
            }
        }

    }


    async logOut(request: { userId: string }) {
        const { userId } = request;

        const user = await this.userService.findOneUserById({userId});
        if(!user){
            throw new BadRequestException("user_not_found");
        }

        await this.userService.addToBlacklist({ userId, refreshToken: user.refreshToken, reason: 'logout' })

        await this.userService.updateUser({
            query: {
                id: userId
            },
            updateData: {
                refreshToken: ""
            }
        })

        return {
            code: HttpStatus.OK,
            message: "success",
        }
    }

    async getProfile(request: { userId: string }) {
        const { userId } = request;
        const user = await this.userService.findOneUserById({ userId });

        const data = plainToClass(GetProfileUserResponseDto, user);
        return {
            code: HttpStatus.OK,
            message: "success",
            data
        }
    }

    async editProfile(request: { userId: string; userName?: string; password?: string; email?: string; role?: UserRole, status?: UserStatus }) {
        const { userId, userName, password, email, role, status } = request;

        const updatedUser = await this.userService.updateUser({
            query: { id: userId },
            updateData: {
                userName,
                password: await this.hashingService.hashPassword(password) || "",
                email,
                role,
                status
            }
        })

        return {
            code: HttpStatus.OK,
            message: "success",
            data: updatedUser
        }

    }
}
