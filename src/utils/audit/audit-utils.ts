// src/utils/audit-utils.ts

import { Request } from 'express';

export function createAuditDetails(req: Request): AuditDetails {
  const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';

  return {
    ip,
    path: req.originalUrl,
    method: req.method,
  };
}

export interface AuditDetails {
  ip: string;
  path: string;
  method: string;
  [key: string]: unknown;
}
