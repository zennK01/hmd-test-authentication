import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EditProfileUserRequestDto, LoginUserRequestDto, RefreshTokenRequestDto, RegisterUserRequestDto } from './dtos';
import { AuthGuard } from 'src/common/guards';
import { CurrentUser, Roles } from 'src/common/decorators';
import { UserRole } from '../user/enums';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post("register")
    @HttpCode(200)
    async registerUser(@Body() body: RegisterUserRequestDto) {
        return this.authService.registerUser({ ...body });
    }

    @Post("login")
    @HttpCode(200)
    async login(@Body() body: LoginUserRequestDto) {
        return this.authService.login({ ...body });
    }

    @Post("refresh")
    @HttpCode(200)
    async refreshToken(@Body() body: RefreshTokenRequestDto){
        return this.authService.refreshToken({ ...body });
    }

    @UseGuards(AuthGuard)
    @Post("logout")
    @HttpCode(200)
    async logOut(@CurrentUser("user") userId: string){
        return this.authService.logOut({ userId });
    }

    @UseGuards(AuthGuard)
    @Get("profile")
    async getProfile(@CurrentUser("user") userId: string){
        return this.authService.getProfile({ userId });
    }

    @UseGuards(AuthGuard)
    @Put("profile")
    @Roles(UserRole.Admin)
    async editProfile(@Body() body: EditProfileUserRequestDto){
        return this.authService.editProfile({ ...body });
    }
}
