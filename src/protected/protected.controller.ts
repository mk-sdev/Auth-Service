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
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RepositoryService } from '../repository/repository.service';
import { UserDocument } from '../repository/user.schema';
import { Role } from '../utils/interfaces';
import { SafeUserDto } from '../dtos/safeUser.dto';
import { LoginDto } from '../dtos/login.dto';
import { HashService } from '../hash.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('protected')
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class ProtectedController {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly hashService: HashService,
  ) {}

  @Roles(Role.ADMIN)
  @Get('user/id/:id')
  async getUserById(@Param('id') id: string): Promise<SafeUserDto | null> {
    const user: UserDocument | null = await this.repositoryService.findOne(id);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
    };
  }

  @Roles(Role.ADMIN)
  @Get('user/email/:email')
  async getUserByMail(
    @Param('email') email: string,
  ): Promise<SafeUserDto | null> {
    const user: UserDocument | null =
      await this.repositoryService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
    };
  }

  @Roles(Role.ADMIN)
  @Put('user/:id')
  async moderateUser(
    @Param('id') id: string,
    @Body() userDto: Omit<SafeUserDto, '_id'>,
  ): Promise<void> {
    await this.repositoryService.moderateUser(id, userDto);
  }

  @Roles(Role.ADMIN)
  @Patch('user/:id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: Pick<LoginDto, 'password'>,
  ): Promise<void> {
    const hashedPassword = await this.hashService.hash(body.password);
    await this.repositoryService.changePassword(id, hashedPassword);
  }

  @Roles(Role.ADMIN)
  @Patch('user/:id/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Param('id') id: string): Promise<void> {
    await this.repositoryService.clearTokens(id);
  }

  @Roles(Role.ADMIN)
  @Get('users')
  async getAllUsers() {
    const users = await this.repositoryService.getAllUsers();
    return users;
  }
}
