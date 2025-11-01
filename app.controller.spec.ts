import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CoreService } from './src/core/core.service';
import { ChangePasswordDto } from './src/dtos/change-password.dto';
import { JwtGuard } from './src/guards/jwt.guard';
import { RegisterDto } from './src/dtos/register.dto';
import { LoginDto } from './src/dtos/login.dto';

describe('AppController (integration)', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: CoreService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppController>(AppController);
  });

  describe('ValidationPipe for RegisterDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // INVALID EMAILS
      { email: '', password: 'Valid1@Pass' }, // empty email
      { email: '   ', password: 'Valid1@Pass' }, // email only spaces
      { email: null, password: 'Valid1@Pass' }, // null email
      { email: undefined, password: 'Valid1@Pass' }, // undefined email
      { email: 12345678, password: 'Valid1@Pass' }, // invalid email type (number)
      { email: {}, password: 'Valid1@Pass' }, // invalid email type (object)
      { email: '@gmail.com', password: 'Valid1@Pass' }, // missing local part
      { email: 'email@gmail', password: 'Valid1@Pass' }, // missing domain TLD
      { email: 'email@.com', password: 'Valid1@Pass' }, // missing domain name
      { email: 'emailgmail.com', password: 'Valid1@Pass' }, // missing @ symbol
      { email: 'email@@gmail.com', password: 'Valid1@Pass' }, // double @
      { email: 'a'.repeat(320) + '@example.com', password: 'Valid1@Pass' }, // excessively long email

      // INVALID PASSWORDS
      { email: 'email@gmail.com', password: '' }, // empty password
      { email: 'email@gmail.com', password: '        ' }, // only spaces
      { email: 'email@gmail.com', password: null }, // null password
      { email: 'email@gmail.com', password: undefined }, // undefined password
      { email: 'email@gmail.com', password: {} }, // wrong type (object)
      { email: 'email@gmail.com', password: 12345678 }, // wrong type (number)
      { email: 'email@gmail.com', password: 'short' }, // too short
      { email: 'email@gmail.com', password: '!aA1' }, // valid structure, but too short
      {
        email: 'email@gmail.com',
        password:
          'this_password_id_too_long_because_it_contains_more_than_30_chars',
      }, // too long
      { email: 'email@gmail.com', password: 'zaq12WSX' }, // no special chars
      { email: 'email@gmail.com', password: 'zaq1@wsx' }, // no uppercase
      { email: 'email@gmail.com', password: 'ZAQ1@WSX' }, // no lowercase
      { email: 'email@gmail.com', password: 'zaq!@WSX' }, // no digit

      { email: 'email@gmail.com', password: 'zaq1!@WSX', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: RegisterDto,
          }),
        ).rejects.toThrow();
      });
    });

    it('should pass validation for valid DTO', async () => {
      const validDto = {
        email: 'example@gmail.com',
        password: 'P@ssword456',
      };
      await expect(
        validationPipe.transform(validDto, {
          type: 'body',
          metatype: RegisterDto,
        }),
      ).resolves.toEqual(validDto);
    });
  });

  describe('ValidationPipe for LoginDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // 🔴 Invalid email formats
      { email: '', password: 'Valid1@Pass' }, // empty email
      { email: 'invalidemail', password: 'Valid1@Pass' }, // missing @ and domain
      { email: 'email@', password: 'Valid1@Pass' }, // missing domain
      { email: '@domain.com', password: 'Valid1@Pass' }, // missing local part
      { email: 'email@domain', password: 'Valid1@Pass' }, // missing dot (e.g. .com)
      { email: null, password: 'Valid1@Pass' }, // null email
      { email: 12345, password: 'Valid1@Pass' }, // wrong type (number)
      { password: 'Valid1@Pass' }, // missing email

      // 🔴 Invalid passwords
      { email: 'email@example.com', password: '' }, // empty password
      { email: 'email@example.com', password: null }, // null password
      { email: 'email@example.com', password: {} }, // invalid type (object)
      { email: 'email@example.com', password: '       ' }, // only spaces
      { email: 'email@example.com' }, // missing password

      { email: 'email@example.com', password: '1234', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: LoginDto,
          }),
        ).rejects.toThrow();
      });
    });

    it('should pass validation for valid DTO', async () => {
      const validDto = {
        email: 'example@gmail.com',
        password: 'Password456',
      };
      await expect(
        validationPipe.transform(validDto, {
          type: 'body',
          metatype: LoginDto,
        }),
      ).resolves.toEqual(validDto);
    });
  });

  describe('ValidationPipe for ChangePasswordDto', () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const invalidDtos = [
      // ❌ INVALID `password`
      { password: '', newPassword: 'Valid1@Pass' }, // empty password
      { password: '   ', newPassword: 'Valid1@Pass' }, // password only spaces
      { password: null, newPassword: 'Valid1@Pass' }, // null password
      { password: undefined, newPassword: 'Valid1@Pass' }, // undefined password
      { password: 12345678, newPassword: 'Valid1@Pass' }, // wrong type (number)
      { password: true, newPassword: 'Valid1@Pass' }, // wrong type (boolean)
      { password: {}, newPassword: 'Valid1@Pass' }, // wrong type (object)
      { password: [], newPassword: 'Valid1@Pass' }, // wrong type (array)
      { newPassword: 'Valid1@Pass' }, // missing password

      // ❌ INVALID `newPassword`
      { password: 'ValidOld1@', newPassword: '' }, // empty newPassword
      { password: 'ValidOld1@', newPassword: '        ' }, // newPassword only spaces
      { password: 'ValidOld1@', newPassword: null }, // null newPassword
      { password: 'ValidOld1@', newPassword: undefined }, // undefined newPassword
      { password: 'ValidOld1@', newPassword: {} }, // wrong type (object)
      { password: 'ValidOld1@', newPassword: [] }, // wrong type (array)
      { password: 'ValidOld1@', newPassword: true }, // wrong type (boolean)
      { password: 'ValidOld1@', newPassword: '!aA1' }, // too short
      { password: 'ValidOld1@', newPassword: 'zaq12WSX' }, // no special characters
      { password: 'ValidOld1@', newPassword: 'zaq1@wsx' }, // no uppercase
      { password: 'ValidOld1@', newPassword: 'ZAQ1@WSX' }, // no lowercase
      { password: 'ValidOld1@', newPassword: 'zaq!@WSX' }, // no numbers
      {
        password: 'ValidOld1@',
        newPassword:
          'this_password_id_too_long_because_it_contains_more_than_30_chars',
      }, // too long
      { password: 'ValidOld1@' }, // missing newPassword
      { password: 'ValidOld1@', newPassword: 'zaq1@WSX', additional: 1 }, // extra attribute
    ];

    invalidDtos.forEach((dto, index) => {
      it(`should throw validation error for invalid DTO #${index + 1}`, async () => {
        await expect(
          validationPipe.transform(dto, {
            type: 'body',
            metatype: ChangePasswordDto,
          }),
        ).rejects.toThrow();
      });
    });

    it('should pass validation for valid DTO', async () => {
      const validDto = {
        password: 'pass',
        newPassword: 'newP@ssword456',
      };
      await expect(
        validationPipe.transform(validDto, {
          type: 'body',
          metatype: ChangePasswordDto,
        }),
      ).resolves.toEqual(validDto);
    });
  });
});
