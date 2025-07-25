import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../utils/interfaces';
import { ProtectedService } from './protected.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('protected')
export class ProtectedController {
  constructor(private readonly protectedService: ProtectedService) {}

  @Roles(Role.ADMIN, Role.MODERATOR) // only admins or moderators are allowed
  @Get('users')
  async getAllUsers() {
    const users = await this.protectedService.getAllUsers();
    return users;
  }
}
