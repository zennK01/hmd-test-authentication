import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class KeyTokenService {
    constructor(
        private jwtService: JwtService
    ) { }

    async createTokenPairs(email: string, privateKey: string, publicKey: string, userId: string) {
        try {
            const payload = {
                publicKey,
                email,
                userId
            }

            const accessToken = await this.jwtService.signAsync(payload, {
                algorithm: "RS256",
                expiresIn: 1 * 60 * 60, // seconds
                privateKey
            })

            const refreshToken = await this.jwtService.signAsync(payload, {
                algorithm: "RS256",
                expiresIn: 10 * 60 * 60,
                privateKey
            })
            return {
                accessToken,
                refreshToken
            }
        } catch (e) {
            console.log("--error createTokenPairs", e)
        }
    }
}
