import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Put,
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
import { SafeUserDto } from '../dtos/safeUser.dto';
import { HashService } from '../utils/hash/hash.service';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserDocument } from '../repository/mongo/user.schema';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { Role } from '../utils/interfaces';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { AuditAction } from '../decorators/audit-action.decorator';
import { CoreService } from 'src/core/core.service';
import { Request, Response } from 'express';
import { accessTokenOptions, refreshTokenOptions } from 'src/utils/constants';

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
  ) {}

  @Roles(Role.ADMIN)
  @AuditAction('LOGIN', 'admin')
  @Patch('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    const { access_token, refresh_token } = await this.coreService.login(
      loginDto.email,
      req,
      loginDto.password,
    );

    response.cookie('access_token', access_token, accessTokenOptions);
    response.cookie('refresh_token', refresh_token, refreshTokenOptions);
    return { message: 'Login successful' };
  }

  @Roles(Role.ADMIN)
  @Get('user/id/:id')
  @UseGuards(JwtGuard, RolesGuard)
  async getUserById(@Param('id') id: string): Promise<SafeUserDto | null> {
    const user: UserDocument | null =
      await this.userCrudRepoService.findOne(id);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: user.roles,
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
    const user: UserDocument | null =
      await this.userCrudRepoService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: user.roles,
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
    @Body() body: Pick<LoginDto, 'password'>, //? Why not registerDto?
  ): Promise<void> {
    console.log('🚀 ~ ProtectedController ~ changePassword ~ body:', body);
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
  async getAllUsers() {
    const users = await this.userCrudRepoService.getAllUsers();
    return users;
  }
}
