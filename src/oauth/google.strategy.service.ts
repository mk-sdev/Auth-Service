import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3000/oauth/google/redirect',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Bezpieczne wyciągnięcie e-maila i statusu weryfikacji
    const email = profile.emails?.[0]?.value;
    const emailVerified = profile._json?.email_verified;

    if (!email) {
      return done(
        new UnauthorizedException('Brak adresu e-mail w profilu Google'),
        false,
      );
    }

    // Możesz dodatkowo wymagać weryfikacji
    if (!emailVerified) {
      return done(
        new UnauthorizedException('Email nie jest zweryfikowany'),
        false,
      );
    }

    const user = {
      email,
      emailVerified,
      // accessToken,
    };

    return done(null, user);
  }
}
