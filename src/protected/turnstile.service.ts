import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface TurnstileVerificationResponse {
  success: boolean;
}

@Injectable()
export class TurnstileService {
  async verify(token: string, request: Request): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      throw new InternalServerErrorException(
        'CAPTCHA verification is not configured',
      );
    }

    const forwardedFor = request.headers['x-forwarded-for'];
    const remoteIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() || request.ip;

    let response: Response;
    try {
      response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret,
            response: token,
            ...(remoteIp ? { remoteip: remoteIp } : {}),
          }),
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'CAPTCHA verification is temporarily unavailable',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'CAPTCHA verification is temporarily unavailable',
      );
    }

    let result: TurnstileVerificationResponse;
    try {
      result = (await response.json()) as TurnstileVerificationResponse;
    } catch {
      throw new ServiceUnavailableException(
        'CAPTCHA verification is temporarily unavailable',
      );
    }

    if (!result.success) {
      throw new UnauthorizedException('CAPTCHA verification failed');
    }
  }
}
