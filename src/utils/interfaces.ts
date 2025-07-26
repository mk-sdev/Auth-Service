import { Request } from 'express';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
  roles: Role[];
}

export interface UserRequest extends Request {
  user?: JwtPayload;
}
