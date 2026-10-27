import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { LoginDto } from '../dtos/login.dto';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { SafeUserDto } from '../dtos/safe-user.dto';
import { HashService } from '../utils/hash/hash.service';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { Role } from '../utils/interfaces';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { AuditAction } from '../decorators/audit-action.decorator';
import { CoreService } from 'src/core/core.service';
import { Request, Response } from 'express';
import {
  accessTokenOptions,
  refreshTokenOptions,
  twoFATokenOptions,
} from 'src/utils/constants';
import { User } from 'src/repository/entities/user.entity';
import { TurnstileService } from './turnstile.service';
// import { UserRole } from 'src/repository/pg/user-role.entity';
// import { extractRoles } from 'src/utils/extractRoles';

@UseInterceptors(AuditInterceptor)
@Controller('protected')
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class ProtectedController {
  constructor(
    private readonly passwordRepoService: PasswordRepoService,
    private readonly tokenRepoService: TokenRepoService,
    private readonly userCrudRepoService: UserCrudRepoService,
    private readonly hashService: HashService,
    private readonly coreService: CoreService,
    private readonly turnstileService: TurnstileService,
  ) { }

  @Roles(Role.ADMIN)
  @AuditAction('LOGIN', 'admin')
  @Patch('login')
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    await this.turnstileService.verify(loginDto.captchaToken, req);
    const result = await this.coreService.login(
      loginDto.email,
      req,
      loginDto.password,
    );

    if ('_2fa_token' in result) {
      response.cookie('2fa_token', result._2fa_token, twoFATokenOptions);
      return { two_factor_required: true };
    }

    const { access_token, refresh_token } = result;

    response.cookie('access_token', access_token, accessTokenOptions);
    response.cookie('refresh_token', refresh_token, refreshTokenOptions);

    return { message: 'Login successful' };
  }

  @Roles(Role.ADMIN)
  @Get('user/id/:id')
  @UseGuards(JwtGuard, RolesGuard)
  async getUserById(@Param('id') id: string): Promise<SafeUserDto | null> {
    const user: User | null =
      await this.userCrudRepoService.findOne(id);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: await this.userCrudRepoService.getUserRoles(user._id as string),
      isVerified: user.isVerified,
      provider: user.provider,
    };
  }

  @Roles(Role.ADMIN)
  @Get('user/email/:email')
  @UseGuards(JwtGuard, RolesGuard)
  async getUserByMail(
    @Param('email') email: string,
  ): Promise<SafeUserDto | null> {
    const user: User | null =
      await this.userCrudRepoService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: await this.userCrudRepoService.getUserRoles(user._id as string),
      isVerified: user.isVerified,
      provider: user.provider,
    };
  }

  @Roles(Role.ADMIN)
  @Put('user/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @AuditAction('MODERATE', 'admin')
  async moderateUser(
    @Param('id') id: string,
    @Body() userDto: Omit<SafeUserDto, '_id'>,
  ): Promise<void> {
    await this.userCrudRepoService.moderateUser(id, userDto);
  }

  @Roles(Role.ADMIN)
  @Patch('user/:id/password')
  @AuditAction('CHANGE_PASSWORD', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async changePassword(
    @Param('id') id: string,
    @Body() body: Pick<LoginDto, 'password'>, //? Why not setPasswordDto?
  ): Promise<void> {
    const hashedPassword = await this.hashService.hash(body.password);
    await this.passwordRepoService.changePassword(id, hashedPassword);
  }

  @Roles(Role.ADMIN)
  @Patch('user/:id/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  async logout(@Param('id') id: string): Promise<void> {
    await this.tokenRepoService.clearTokens(id);
  }

  @Roles(Role.ADMIN)
  @Get('users')
  @UseGuards(JwtGuard, RolesGuard)
  async getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const { users, total } = await this.userCrudRepoService.getUsers(
      safeLimit,
      safePage - 1,
    );
    return {
      users,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
