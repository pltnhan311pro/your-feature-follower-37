// User Service - manages user data CRUD operations (Supabase version)
// Maps to localStorage key: hr_portal_users, hr_portal_leave_balances
import { User, LeaveBalance, UserRole, UserStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper to convert DB profile to User type
const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  employeeId: profile.employee_id,
  fullName: profile.full_name,
  email: profile.email,
  phone: profile.phone || '',
  avatar: profile.avatar,
  role: profile.role as UserRole,
  department: profile.department,
  position: profile.position,
  location: profile.location || '',
  startDate: profile.start_date,
  contractType: profile.contract_type || '',
  managerId: profile.manager_id,
  managerName: profile.manager?.full_name,
  baseSalary: Number(profile.base_salary) || 0,
  status: profile.status as UserStatus,
  idNumber: profile.id_number || '',
});

// Helper to convert User to DB format
const mapUserToProfile = (user: Partial<User>): any => {
  const profile: any = {};
  if (user.employeeId !== undefined) profile.employee_id = user.employeeId;
  if (user.fullName !== undefined) profile.full_name = user.fullName;
  if (user.email !== undefined) profile.email = user.email;
  if (user.phone !== undefined) profile.phone = user.phone;
  if (user.avatar !== undefined) profile.avatar = user.avatar;
  if (user.role !== undefined) profile.role = user.role;
  if (user.department !== undefined) profile.department = user.department;
  if (user.position !== undefined) profile.position = user.position;
  if (user.location !== undefined) profile.location = user.location;
  if (user.startDate !== undefined) profile.start_date = user.startDate;
  if (user.contractType !== undefined) profile.contract_type = user.contractType;
  if (user.managerId !== undefined) profile.manager_id = user.managerId;
  if (user.baseSalary !== undefined) profile.base_salary = user.baseSalary;
  if (user.status !== undefined) profile.status = user.status;
  if (user.idNumber !== undefined) profile.id_number = user.idNumber;
  return profile;
};

// Helper to convert DB leave balance
const mapDbLeaveBalance = (balance: any): LeaveBalance => ({
  id: balance.id,
  userId: balance.user_id,
  annualTotal: balance.annual_total,
  annualUsed: balance.annual_used,
  sickTotal: balance.sick_total,
  sickUsed: balance.sick_used,
  unpaidUsed: balance.unpaid_used,
});

export class UserService {
  static async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return (data || []).map(mapProfileToUser);
  }

  static async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Error fetching user:', error);
      return null;
    }
    return mapProfileToUser(data);
  }

  static async getByEmployeeId(employeeId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('employee_id', employeeId)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapProfileToUser(data);
  }

  static async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('email', email)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapProfileToUser(data);
  }

  static async create(user: User): Promise<User | null> {
    // Note: Profile creation is handled by the trigger on auth.users
    // This method is for admin creating employees - requires special handling
    const { data, error } = await supabase
      .from('profiles')
      .insert(mapUserToProfile(user))
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    
    // Leave balance is auto-created by trigger
    return mapProfileToUser(data);
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(mapUserToProfile(updates))
      .eq('id', id)
      .select('*, manager:manager_id(full_name)')
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return mapProfileToUser(data);
  }

  static async delete(id: string): Promise<boolean> {
    // Soft delete - just update status to inactive
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id);
    
    return !error;
  }

  static async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbLeaveBalance(data);
  }

  static async updateLeaveBalance(userId: string, updates: Partial<LeaveBalance>): Promise<LeaveBalance | null> {
    const dbUpdates: any = {};
    if (updates.annualTotal !== undefined) dbUpdates.annual_total = updates.annualTotal;
    if (updates.annualUsed !== undefined) dbUpdates.annual_used = updates.annualUsed;
    if (updates.sickTotal !== undefined) dbUpdates.sick_total = updates.sickTotal;
    if (updates.sickUsed !== undefined) dbUpdates.sick_used = updates.sickUsed;
    if (updates.unpaidUsed !== undefined) dbUpdates.unpaid_used = updates.unpaidUsed;

    const { data, error } = await supabase
      .from('leave_balances')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating leave balance:', error);
      return null;
    }
    return mapDbLeaveBalance(data);
  }

  static async getByDepartment(department: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('department', department);
    
    if (error) return [];
    return (data || []).map(mapProfileToUser);
  }

  static async getByManager(managerId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('manager_id', managerId);
    
    if (error) return [];
    return (data || []).map(mapProfileToUser);
  }
}
