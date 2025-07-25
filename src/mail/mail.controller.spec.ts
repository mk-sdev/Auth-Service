import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangeEmailDto } from '../dtos/changeEmail.dto';
import { EmailDto } from '../dtos/email.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

describe('MailController (integration)', () => {
  let controller: MailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MailController>(MailController);
  });

  describe('ValidationPipe for EmailDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      { email: '' }, // empty email
      { email: '   ' }, // email only spaces
      { email: null }, // null email
      { email: undefined }, // undefined email
      { email: 12345678 }, // invalid email type (number)
      { email: {} }, // invalid email type (object)
      { email: '@gmail.com' }, // missing local part
      { email: 'email@gmail' }, // missing domain TLD
      { email: 'email@.com' }, // missing domain name
      { email: 'emailgmail.com' }, // missing @ symbol
      { email: 'email@@gmail.com' }, // double @
      { email: 'a'.repeat(320) + '@example.com' }, // excessively long email

      { email: 'email@gmail.com', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: EmailDto,
          }),
        ).rejects.toThrow();
      });
    });
  });

  describe('ValidationPipe for LoginDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // Invalid email formats
      { newEmail: '', password: 'Valid1@Pass' }, // empty email
      { newEmail: 'invalidemail', password: 'Valid1@Pass' }, // missing @ and domain
      { newEmail: 'email@', password: 'Valid1@Pass' }, // missing domain
      { newEmail: '@domain.com', password: 'Valid1@Pass' }, // missing local part
      { newEmail: 'email@domain', password: 'Valid1@Pass' }, // missing dot (e.g. .com)
      { newEmail: null, password: 'Valid1@Pass' }, // null email
      { newEmail: 12345, password: 'Valid1@Pass' }, // wrong type (number)
      { password: 'Valid1@Pass' }, // missing email

      // Invalid passwords
      { newEmail: 'email@example.com', password: '' }, // empty password
      { newEmail: 'email@example.com', password: null }, // null password
      { newEmail: 'email@example.com', password: {} }, // invalid type (object)
      { newEmail: 'email@example.com', password: '       ' }, // only spaces
      { newEmail: 'email@example.com' }, // missing password

      { newEmail: 'email@example.com', password: '1234', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: ChangeEmailDto,
          }),
        ).rejects.toThrow();
      });
    });
  });

  describe('EmailDto transform', () => {
    it('should transform email to lowercase using class-transformer', () => {
      const plain = { email: 'ExAmple@EMAIL.Com' };
      const instance = plainToInstance(EmailDto, plain);

      expect(instance.email).toBe('example@email.com');

      const errors = validateSync(instance);
      expect(errors.length).toBe(0);
    });
  });
});
