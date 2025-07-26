import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../repository/repository.service';
import { UserDocument } from '../repository/user.schema';

@Injectable()
export class ProtectedService {
  constructor(private readonly repositoryService: RepositoryService) {}
  // async getAllUsers(options: {
  //   skip: number;
  //   limit: number;
  //   filters: {
  //     isVerified?: boolean;
  //     role?: string;
  //   };
  // }): Promise<UserDocument[]> {
  //   const { skip, limit, filters } = options;

  //   const query: any = {};

  //   if (filters.isVerified !== undefined) {
  //     query.isVerified = filters.isVerified;
  //   }

  //   if (filters.role) {
  //     query.roles = filters.role; // zakładamy, że role to tablica, więc używamy dopasowania
  //   }

  //   return this.repositoryService.getAllUsers(query, skip, limit);
  // }
}
