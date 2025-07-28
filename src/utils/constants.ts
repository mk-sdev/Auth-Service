import { CookieOptions } from 'express';

export const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 15, // 15 minutes
};

export const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60, // 1 hour
};

// access jwt lifespan
export const access_jwt_lifespan = '15m';
// refresh jwt lifespan
export const refresh_jwt_lifespan = '1h';

// token lifespan to confirm password change
export const password_reset_lifespan = 1000 * 60 * 20; // 20 min
// token lifespan to confirm email change
export const email_change_lifespan = 1000 * 60 * 20; // 20 min
// account verification token lifespan
export const account_verification_lifespan = 1000 * 60 * 20; // 20 min
// period between deleting account by a user and its actual deletion in the db
export const account_deletion_lifespan = 1000 * 60 * 60 * 24 * 14; //2 weeks

export const URL = 'http://localhost:3000';
export const FRONTEND_URL = 'http://localhost:8081';
export const OAUTH_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

export const WEB_REDIRECT_URI = 'http://localhost:8081/oauth-callback';
export const MOBILE_REDIRECT_URI = 'imagehub://oauth-callback';
export const CALLBACK_URL = 'http://localhost:3000/oauth/google/redirect';
