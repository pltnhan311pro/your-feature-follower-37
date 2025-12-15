// User Service - manages user data CRUD operations
import { User, LeaveBalance } from '@/types';
import { StorageService } from './StorageService';

const USERS_KEY = 'users';
const LEAVE_BALANCE_KEY = 'leave_balances';

export class UserService {
  static getAll(): User[] {
    return StorageService.getAll<User>(USERS_KEY);
  }

  static getById(id: string): User | null {
    return StorageService.findById<User>(USERS_KEY, id);
  }

  static getByEmployeeId(employeeId: string): User | null {
    const users = StorageService.findByField<User>(USERS_KEY, 'employeeId', employeeId);
    return users[0] || null;
  }

  static create(user: User): User {
    StorageService.addItem(USERS_KEY, user);
    // Initialize leave balance for new user
    const leaveBalance: LeaveBalance = {
      id: crypto.randomUUID(),
      userId: user.id,
      annualTotal: 12,
      annualUsed: 0,
      sickTotal: 7,
      sickUsed: 0,
      unpaidUsed: 0,
    };
    StorageService.addItem(LEAVE_BALANCE_KEY, leaveBalance);
    return user;
  }

  static update(id: string, updates: Partial<User>): User | null {
    return StorageService.updateItem<User>(USERS_KEY, id, updates);
  }

  static delete(id: string): boolean {
    // Also delete related leave balance
    const balances = StorageService.getAll<LeaveBalance>(LEAVE_BALANCE_KEY);
    const filteredBalances = balances.filter(b => b.userId !== id);
    StorageService.set(LEAVE_BALANCE_KEY, filteredBalances);
    
    return StorageService.deleteItem<User>(USERS_KEY, id);
  }

  static getLeaveBalance(userId: string): LeaveBalance | null {
    const balances = StorageService.findByField<LeaveBalance>(LEAVE_BALANCE_KEY, 'userId', userId);
    return balances[0] || null;
  }

  static updateLeaveBalance(userId: string, updates: Partial<LeaveBalance>): LeaveBalance | null {
    const balances = StorageService.getAll<LeaveBalance>(LEAVE_BALANCE_KEY);
    const index = balances.findIndex(b => b.userId === userId);
    if (index === -1) return null;
    
    balances[index] = { ...balances[index], ...updates };
    StorageService.set(LEAVE_BALANCE_KEY, balances);
    return balances[index];
  }

  static getByDepartment(department: string): User[] {
    return StorageService.findByField<User>(USERS_KEY, 'department', department);
  }

  static getByManager(managerId: string): User[] {
    return StorageService.findByField<User>(USERS_KEY, 'managerId', managerId);
  }
}
