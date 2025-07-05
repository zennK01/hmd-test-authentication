import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { HashingModule } from '../hashing/hashing.module';
import { JwtModule } from '@nestjs/jwt';
import { KeyTokenModule } from '../key-token/key-token.module';


@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [ 
    UserModule, 
    HashingModule,
    KeyTokenModule,
    JwtModule.register({
      global: true,
      signOptions: {
        algorithm: "RS256"
      }
    })
  ]
})
export class AuthModule {}
