import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { access_jwt_lifespan, refresh_jwt_lifespan } from './constants';

@Module({
  providers: [
    {
      provide: 'JWT_ACCESS_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: process.env.JWT_ACCESS_SECRET,
          signOptions: { expiresIn: access_jwt_lifespan },
        });
      },
    },
    {
      provide: 'JWT_REFRESH_SERVICE',
      useFactory: () => {
        return new JwtService({
          secret: process.env.JWT_REFRESH_SECRET,
          signOptions: { expiresIn: refresh_jwt_lifespan },
        });
      },
    },
  ],
  exports: ['JWT_ACCESS_SERVICE', 'JWT_REFRESH_SERVICE'],
})
export class TokensModule {}
