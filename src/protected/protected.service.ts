import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../repository/repository.service';
import { UserDocument } from '../repository/user.schema';

@Injectable()
export class ProtectedService {
  constructor(private readonly repositoryService: RepositoryService) {}
  async getAllUsers(): Promise<UserDocument[]> {
    const users: UserDocument[] = await this.repositoryService.getAllUsers();
    return users;
  }
}
