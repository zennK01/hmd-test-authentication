import { Injectable } from "@nestjs/common";
import { User } from "../models";
import { InjectModel } from "@nestjs/sequelize";
import { CreateUserInterface } from "../interfaces";

@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User
    ){}


    createUser(user: CreateUserInterface): Promise<User>{
        return this.userModel.create({...user});
    }

    findOneUser(query: Partial<User>): Promise<User>{
        return this.userModel.findOne({ where: { ...query }, raw: true })
    }

    async findOneAndUpdate(query: Partial<User>, updateData: Partial<User>){
        const user = await this.userModel.findOne({ where: { ...query } });
        if(!user) return null;

        return await user.update(updateData)
    }
}