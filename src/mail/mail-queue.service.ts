import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { AuditLoggerService } from '../utils/audit/audit.service';
import { MailService } from './mail.service';

interface MailAuditContext {
  event: string;
  ip: string;
  path: string;
  method: string;
  email?: string;
}

interface TokenEmailJob {
  toEmail: string;
  token: string;
  subject: string;
  purpose: string;
  contextData?: Record<string, unknown>;
  baseUrl: string;
  path: string;
  audit: MailAuditContext;
}

@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private queue: Queue<TokenEmailJob>;
  private worker: Worker<TokenEmailJob>;

  constructor(
    private readonly mailService: MailService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  onModuleInit() {
    const connection = {
      host: process.env.REDIS_URI || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    };
    this.queue = new Queue<TokenEmailJob>('emails', { connection });
    this.worker = new Worker<TokenEmailJob>(
      'emails',
      (job) => this.processTokenEmail(job),
      { connection },
    );
    this.worker.on('failed', (job, error) => {
      if (job) this.logFailure(job.data.audit, error);
    });
    this.worker.on('error', (error) => this.logger.error('Email worker error', error));
  }

  async enqueueTokenEmail(data: TokenEmailJob): Promise<void> {
    try {
      await this.queue.add('send-token-email', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 1000,
      });
    } catch (error) {
      this.logFailure(data.audit, error);
    }
  }

  async onModuleDestroy() {
    await Promise.all([this.worker?.close(), this.queue?.close()]);
  }

  private async processTokenEmail(job: Job<TokenEmailJob>) {
    const data = job.data;
    await this.mailService.sendMailWithToken(
      data.toEmail,
      data.token,
      data.subject,
      data.purpose,
      data.contextData,
      data.baseUrl,
      'token',
      data.path,
    );
  }

  private logFailure(audit: MailAuditContext, error: unknown) {
    this.auditLogger.warn('system', audit.event, {
      ip: audit.ip,
      path: audit.path,
      method: audit.method,
      ...(audit.email ? { email: audit.email } : {}),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
