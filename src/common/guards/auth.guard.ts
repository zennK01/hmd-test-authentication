import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "src/modules/auth/auth.service"
import { IS_PUBLIC_KEY, ROLES_KEY } from "../decorators"
import { UserService } from "src/modules/user/user.service"
import { UserRole } from "src/modules/user/enums"


@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
        private readonly userService: UserService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])

        if (isPublic) {
            return true
        }

        const { token } = this.extractCredentialFromHeader(request)

        if (!token) {
            throw new HttpException("unauthorized", HttpStatus.UNAUTHORIZED, {
                cause: {
                    code: HttpStatus.UNAUTHORIZED
                }
            })
        }

        const { publicKey, userId, email } = await this.jwtService.decode(token)
        const user = await this.userService.findOneUser({ email });

        if (!user || !user.refreshToken) {
            throw new HttpException("unauthorized", HttpStatus.UNAUTHORIZED, {
                cause: {
                    code: HttpStatus.UNAUTHORIZED
                }
            })
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                publicKey,
                algorithms: ["RS256"]
            })
            request["userId"] = payload.userId;
            request["roles"] = [user.role]

        } catch (error: any) {
            throw new HttpException("unauthorized", HttpStatus.UNAUTHORIZED, {
                cause: {
                    code: HttpStatus.UNAUTHORIZED
                }
            })
        }

        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()])
        if (!requiredRoles) {
            return true
        }
        const hasRoles = requiredRoles.some((role) => request.roles?.includes(role))

        if (!hasRoles) {
            throw new HttpException("forbidden", HttpStatus.FORBIDDEN, {
                cause: {
                    code: `role_unauthorized`
                }
            })
        }

        return true




    }

    private extractCredentialFromHeader(request: any): { token: string } {
        const token = request.headers["authorization"]?.split(" ")[1] || ""
        return {
            token
        }
    }
}