import { UserRole } from 'src/repository/pg/user-role.entity';
import { Role } from './interfaces';

export function extractRoles(roles: Role[] | UserRole[] | undefined): Role[] {
  if (!roles || roles.length === 0) return [Role.USER];
  if ((roles[0] as UserRole).role !== undefined) {
    return (roles as UserRole[]).map((r) => r.role);
  }
  return roles as Role[];
}
