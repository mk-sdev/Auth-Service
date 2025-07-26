import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RepositoryService } from '../repository/repository.service';
import { UserDocument } from '../repository/user.schema';
import { Role } from '../utils/interfaces';
import { SafeUserDto } from '../dtos/safeUser.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('protected')
export class ProtectedController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Roles(Role.ADMIN)
  @Get('user')
  async getUser(
    @Query('id') id: string,
    @Query('email') email: string,
  ): Promise<SafeUserDto | null> {
    let user: UserDocument | null;

    if (id) user = await this.repositoryService.findOne(id);
    user = await this.repositoryService.findOneByEmail(email);

    if (!user) throw new NotFoundException('User not found');

    return {
      _id: user._id as string,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
    };
  }

  @Roles(Role.ADMIN)
  @Patch('user/:id')
  async moderateUser(
    @Param('id') id: string,
    @Body() userDto: Omit<SafeUserDto, '_id'>,
  ): Promise<void> {
    await this.repositoryService.moderateUser(id, userDto);
  }

  @Roles(Role.ADMIN)
  @Get('users')
  async getAllUsers() {
    const users = await this.repositoryService.getAllUsers();
    return users;
  }
}
