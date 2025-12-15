// Authentication Service - manages user login/logout and current session
import { User, UserRole } from '@/types';
import { StorageService } from './StorageService';
import { UserService } from './UserService';

const CURRENT_USER_KEY = 'current_user';

export class AuthService {
  static getCurrentUser(): User | null {
    return StorageService.get<User>(CURRENT_USER_KEY);
  }

  static login(employeeId: string, password: string): User | null {
    // In a real app, this would validate against a backend
    // For now, we just find the user by employeeId
    const user = UserService.getByEmployeeId(employeeId);
    
    if (user && password === '123456') { // Simple password for demo
      StorageService.set(CURRENT_USER_KEY, user);
      return user;
    }
    
    return null;
  }

  static logout(): void {
    StorageService.remove(CURRENT_USER_KEY);
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static hasRole(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      employee: 1,
      manager: 2,
      admin: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  static canApproveLeave(): boolean {
    return this.hasRole('manager');
  }

  static canManageUsers(): boolean {
    return this.hasRole('admin');
  }

  static updateCurrentUser(updates: Partial<User>): User | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    StorageService.set(CURRENT_USER_KEY, updatedUser);
    return updatedUser;
  }
}
