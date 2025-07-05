import { MiddlewareConsumer, Module, NestModule, RequestMethod, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, UserModule } from './modules';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { AuthRateLimitMiddleware } from './common/middleware';


@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: '127.0.0.1',
      port: 8822,
      username: 'root',
      password: 'zenn',
      database: 'test',
      autoLoadModels: true,
      synchronize: true,
    }),
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3,
      },
      {
        name: 'medium', 
        ttl: 10000, // 10 seconds
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ])
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe
    },
    AuthRateLimitMiddleware,
    ThrottlerStorageService,
    AppService
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: '/api/auth/register', method: RequestMethod.POST },
        { path: '/api/auth/login', method: RequestMethod.POST },
        { path: '/api/auth/refresh', method: RequestMethod.POST },
        { path: '/api/auth/logout', method: RequestMethod.POST },
        { path: '/api/auth/profile', method: RequestMethod.GET }
      );
  }
}
