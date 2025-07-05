import { Injectable } from "@nestjs/common"
import * as bcrypt from "bcrypt"

@Injectable()
export class HashingService {
    private saltOrRounds = 10

    async hashPassword(password: string) {
        const passwordHash = await bcrypt.hash(password, this.saltOrRounds)
        return passwordHash
    }

    async comparePassword(password: string, passwordHashed: string) {
        return await bcrypt.compare(password, passwordHashed)
    }
}