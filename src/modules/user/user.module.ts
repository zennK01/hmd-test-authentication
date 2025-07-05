import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models';
import { HashingModule } from '../hashing/hashing.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ User ]),
    HashingModule
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [ UserService ]
})
export class UserModule {}
