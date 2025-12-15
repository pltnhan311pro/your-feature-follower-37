// Authentication Service - manages user login/logout using Supabase Auth
// Maps to localStorage key: hr_portal_current_user
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
  status: profile.status as User['status'],
  idNumber: profile.id_number || '',
});

export class AuthService {
  private static currentUser: User | null = null;
  private static session: Session | null = null;

  static async initialize(): Promise<void> {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    this.session = session;
    
    if (session?.user) {
      await this.loadUserProfile(session.user.id);
    }
  }

  static async loadUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Error loading user profile:', error);
      return null;
    }
    
    this.currentUser = mapProfileToUser(data);
    return this.currentUser;
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static getSession(): Session | null {
    return this.session;
  }

  static setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  static setSession(session: Session | null): void {
    this.session = session;
  }

  static async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return null;
    }

    if (data.user) {
      this.session = data.session;
      const user = await this.loadUserProfile(data.user.id);
      
      // Check if user is inactive
      if (user && user.status === 'inactive') {
        await this.logout();
        return null;
      }
      
      return user;
    }

    return null;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.session = null;
  }

  static isAuthenticated(): boolean {
    return this.currentUser !== null && this.session !== null;
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

  static async updateCurrentUser(updates: Partial<User>): Promise<User | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    // Update profile in database
    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.location !== undefined) dbUpdates.location = updates.location;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id)
      .select('*, manager:manager_id(full_name)')
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    this.currentUser = mapProfileToUser(data);
    return this.currentUser;
  }
}
