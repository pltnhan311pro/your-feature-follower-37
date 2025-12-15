// HR Admin Service - manages HR-specific operations (Supabase version)
// Maps to localStorage keys: hr_portal_employee_history, payroll_config, payroll_runs
import { User, Payslip, LeaveRequest, OvertimeRequest } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { UserService } from './UserService';
import { PayslipService } from './PayslipService';
import { LeaveService } from './LeaveService';
import { OvertimeService } from './OvertimeService';

export interface EmployeeHistoryEntry {
  id: string;
  userId: string;
  type: 'created' | 'updated' | 'promoted' | 'department_change' | 'status_change';
  description: string;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface PayrollConfig {
  otMultiplier: number;
  socialInsuranceRate: number;
  healthInsuranceRate: number;
  unemploymentInsuranceRate: number;
  personalDeduction: number;
  dependentDeduction: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PayrollRun {
  id: string;
  period: string;
  periodLabel: string;
  status: 'not_run' | 'processing' | 'completed';
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  runAt?: string;
  runBy?: string;
  completedAt?: string;
}

// Helper functions
const mapDbToHistoryEntry = (row: any): EmployeeHistoryEntry => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  description: row.description,
  previousValue: row.previous_value,
  newValue: row.new_value,
  performedBy: row.performed_by,
  performedByName: row.performed_by_name || '',
  createdAt: row.created_at,
});

const mapDbToPayrollConfig = (row: any): PayrollConfig => ({
  otMultiplier: Number(row.ot_multiplier),
  socialInsuranceRate: Number(row.social_insurance_rate),
  healthInsuranceRate: Number(row.health_insurance_rate),
  unemploymentInsuranceRate: Number(row.unemployment_insurance_rate),
  personalDeduction: Number(row.personal_deduction),
  dependentDeduction: Number(row.dependent_deduction),
  updatedAt: row.updated_at,
  updatedBy: row.updated_by || 'system',
});

const mapDbToPayrollRun = (row: any): PayrollRun => ({
  id: row.id,
  period: row.period,
  periodLabel: row.period_label,
  status: row.status,
  totalEmployees: row.total_employees,
  totalGrossSalary: Number(row.total_gross_salary),
  totalNetSalary: Number(row.total_net_salary),
  runAt: row.run_at,
  runBy: row.run_by,
  completedAt: row.completed_at,
});

export class HRService {
  // ========== Employee Management ==========
  
  static async getAllEmployees(): Promise<User[]> {
    return UserService.getAll();
  }

  static async getActiveEmployees(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)')
      .neq('status', 'inactive')
      .order('full_name');
    
    if (error) return [];
    return (data || []).map((profile: any) => ({
      id: profile.id,
      employeeId: profile.employee_id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      avatar: profile.avatar,
      role: profile.role,
      department: profile.department,
      position: profile.position,
      location: profile.location || '',
      startDate: profile.start_date,
      contractType: profile.contract_type || '',
      managerId: profile.manager_id,
      managerName: profile.manager?.full_name,
      baseSalary: Number(profile.base_salary) || 0,
      status: profile.status,
      idNumber: profile.id_number || '',
    }));
  }

  static async searchEmployees(query: string, filters: {
    department?: string;
    status?: string;
    position?: string;
  } = {}): Promise<User[]> {
    let queryBuilder = supabase
      .from('profiles')
      .select('*, manager:manager_id(full_name)');

    if (query) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`);
    }

    if (filters.department) {
      queryBuilder = queryBuilder.eq('department', filters.department);
    }

    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status);
    }

    if (filters.position) {
      queryBuilder = queryBuilder.ilike('position', `%${filters.position}%`);
    }

    const { data, error } = await queryBuilder.order('full_name');
    
    if (error) return [];
    return (data || []).map((profile: any) => ({
      id: profile.id,
      employeeId: profile.employee_id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      avatar: profile.avatar,
      role: profile.role,
      department: profile.department,
      position: profile.position,
      location: profile.location || '',
      startDate: profile.start_date,
      contractType: profile.contract_type || '',
      managerId: profile.manager_id,
      managerName: profile.manager?.full_name,
      baseSalary: Number(profile.base_salary) || 0,
      status: profile.status,
      idNumber: profile.id_number || '',
    }));
  }

  static async createEmployee(data: Omit<User, 'id' | 'employeeId'>, performedBy: { id: string; name: string }): Promise<User | null> {
    // For creating employees, we need to use Supabase Auth admin functions
    // This would typically be done through an edge function
    // For now, this is a placeholder - actual implementation requires auth admin
    console.warn('Creating employees requires Supabase Auth admin - implement via edge function');
    return null;
  }

  static async updateEmployee(
    id: string, 
    updates: Partial<User>, 
    performedBy: { id: string; name: string }
  ): Promise<User | null> {
    const currentUser = await UserService.getById(id);
    if (!currentUser) return null;

    // Track specific changes for history
    if (updates.position && updates.position !== currentUser.position) {
      await this.addHistoryEntry({
        userId: id,
        type: 'promoted',
        description: 'Thay đổi chức vụ',
        previousValue: currentUser.position,
        newValue: updates.position,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    if (updates.department && updates.department !== currentUser.department) {
      await this.addHistoryEntry({
        userId: id,
        type: 'department_change',
        description: 'Chuyển phòng ban',
        previousValue: currentUser.department,
        newValue: updates.department,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    if (updates.status && updates.status !== currentUser.status) {
      await this.addHistoryEntry({
        userId: id,
        type: 'status_change',
        description: 'Thay đổi trạng thái',
        previousValue: currentUser.status,
        newValue: updates.status,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    const hasSpecificChanges = updates.position || updates.department || updates.status;
    if (!hasSpecificChanges) {
      await this.addHistoryEntry({
        userId: id,
        type: 'updated',
        description: 'Cập nhật thông tin cá nhân',
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    return UserService.update(id, updates);
  }

  static async softDeleteEmployee(id: string, performedBy: { id: string; name: string }): Promise<User | null> {
    const user = await UserService.getById(id);
    if (!user) return null;

    await this.addHistoryEntry({
      userId: id,
      type: 'status_change',
      description: 'Nhân viên nghỉ việc',
      previousValue: user.status,
      newValue: 'inactive',
      performedBy: performedBy.id,
      performedByName: performedBy.name,
    });

    return UserService.update(id, { status: 'inactive' });
  }

  // ========== Employee History / Timeline ==========

  static async addHistoryEntry(data: Omit<EmployeeHistoryEntry, 'id' | 'createdAt'>): Promise<EmployeeHistoryEntry | null> {
    const { data: inserted, error } = await supabase
      .from('employee_history')
      .insert({
        user_id: data.userId,
        type: data.type,
        description: data.description,
        previous_value: data.previousValue,
        new_value: data.newValue,
        performed_by: data.performedBy,
        performed_by_name: data.performedByName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding history entry:', error);
      return null;
    }
    return mapDbToHistoryEntry(inserted);
  }

  static async getEmployeeHistory(userId: string): Promise<EmployeeHistoryEntry[]> {
    const { data, error } = await supabase
      .from('employee_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToHistoryEntry);
  }

  // ========== Payroll Configuration ==========

  static async getPayrollConfig(): Promise<PayrollConfig> {
    const { data, error } = await supabase
      .from('payroll_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      // Return default config
      return {
        otMultiplier: 1.5,
        socialInsuranceRate: 0.08,
        healthInsuranceRate: 0.015,
        unemploymentInsuranceRate: 0.01,
        personalDeduction: 11000000,
        dependentDeduction: 4400000,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      };
    }
    return mapDbToPayrollConfig(data);
  }

  static async updatePayrollConfig(updates: Partial<PayrollConfig>, updatedBy: string): Promise<PayrollConfig | null> {
    const dbUpdates: any = { updated_by: updatedBy };
    if (updates.otMultiplier !== undefined) dbUpdates.ot_multiplier = updates.otMultiplier;
    if (updates.socialInsuranceRate !== undefined) dbUpdates.social_insurance_rate = updates.socialInsuranceRate;
    if (updates.healthInsuranceRate !== undefined) dbUpdates.health_insurance_rate = updates.healthInsuranceRate;
    if (updates.unemploymentInsuranceRate !== undefined) dbUpdates.unemployment_insurance_rate = updates.unemploymentInsuranceRate;
    if (updates.personalDeduction !== undefined) dbUpdates.personal_deduction = updates.personalDeduction;
    if (updates.dependentDeduction !== undefined) dbUpdates.dependent_deduction = updates.dependentDeduction;

    // Get existing config id
    const { data: existing } = await supabase
      .from('payroll_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('payroll_config')
        .update(dbUpdates)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) return null;
      return mapDbToPayrollConfig(data);
    }
    return null;
  }

  // ========== Payroll Run ==========

  static async getPayrollRuns(): Promise<PayrollRun[]> {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('period', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToPayrollRun);
  }

  static async getPayrollRun(period: string): Promise<PayrollRun | null> {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('period', period)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToPayrollRun(data);
  }

  static async runPayroll(period: string, runBy: { id: string; name: string }): Promise<PayrollRun | null> {
    const activeEmployees = await this.getActiveEmployees();
    const config = await this.getPayrollConfig();
    
    const [year, month] = period.split('-');
    const periodLabel = `Tháng ${month}, ${year}`;

    // Create or update payroll run
    let payrollRun = await this.getPayrollRun(period);
    
    if (!payrollRun) {
      const { data, error } = await supabase
        .from('payroll_runs')
        .insert({
          period,
          period_label: periodLabel,
          status: 'processing',
          total_employees: 0,
          total_gross_salary: 0,
          total_net_salary: 0,
          run_at: new Date().toISOString(),
          run_by: runBy.name,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating payroll run:', error);
        return null;
      }
      payrollRun = mapDbToPayrollRun(data);
    } else {
      await supabase
        .from('payroll_runs')
        .update({
          status: 'processing',
          run_at: new Date().toISOString(),
          run_by: runBy.name,
        })
        .eq('id', payrollRun.id);
    }

    let totalGross = 0;
    let totalNet = 0;

    for (const employee of activeEmployees) {
      // Get approved OT hours for this period
      const otRequests = await OvertimeService.getByUserId(employee.id);
      const approvedOt = otRequests.filter(r => r.status === 'approved' && r.date.startsWith(period));
      const totalOTHours = approvedOt.reduce((sum, r) => sum + r.hoursCount, 0);

      const hourlyRate = employee.baseSalary / 176;
      const otPay = Math.round(hourlyRate * totalOTHours * config.otMultiplier);

      // Get unpaid leave days
      const leaveRequests = await LeaveService.getByUserId(employee.id);
      const unpaidLeaves = leaveRequests.filter(r => r.status === 'approved' && r.leaveType === 'unpaid');
      const unpaidLeaveDays = unpaidLeaves.reduce((sum, r) => sum + r.daysCount, 0);
      const dailyRate = employee.baseSalary / 22;
      const unpaidDeduction = unpaidLeaveDays * dailyRate;

      const grossSalary = employee.baseSalary + otPay;
      const socialInsurance = Math.round(grossSalary * config.socialInsuranceRate);
      const healthInsurance = Math.round(grossSalary * config.healthInsuranceRate);
      
      const taxableIncome = grossSalary - socialInsurance - healthInsurance - config.personalDeduction;
      const tax = taxableIncome > 0 ? Math.round(this.calculateTax(taxableIncome)) : 0;

      const netSalary = grossSalary - socialInsurance - healthInsurance - tax - unpaidDeduction;

      const existingPayslip = await PayslipService.getByPeriod(employee.id, period);
      if (existingPayslip) {
        await PayslipService.update(existingPayslip.id, {
          baseSalary: employee.baseSalary,
          overtime: otPay,
          bonus: 0,
          allowances: 0,
          socialInsurance,
          healthInsurance,
          tax,
          deductions: unpaidDeduction,
          netSalary,
          status: 'pending',
        });
      } else {
        await PayslipService.create({
          userId: employee.id,
          period,
          periodLabel,
          baseSalary: employee.baseSalary,
          overtime: otPay,
          bonus: 0,
          allowances: 0,
          socialInsurance,
          healthInsurance,
          tax,
          deductions: unpaidDeduction,
          netSalary,
          status: 'pending',
        });
      }

      totalGross += grossSalary;
      totalNet += netSalary;
    }

    // Update payroll run status
    const { data: updatedRun, error } = await supabase
      .from('payroll_runs')
      .update({
        status: 'completed',
        total_employees: activeEmployees.length,
        total_gross_salary: totalGross,
        total_net_salary: totalNet,
        completed_at: new Date().toISOString(),
      })
      .eq('id', payrollRun.id)
      .select()
      .single();

    if (error) return payrollRun;
    return mapDbToPayrollRun(updatedRun);
  }

  private static calculateTax(taxableIncome: number): number {
    const brackets = [
      { limit: 5000000, rate: 0.05 },
      { limit: 10000000, rate: 0.10 },
      { limit: 18000000, rate: 0.15 },
      { limit: 32000000, rate: 0.20 },
      { limit: 52000000, rate: 0.25 },
      { limit: 80000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 },
    ];

    let tax = 0;
    let remaining = taxableIncome;
    let previousLimit = 0;

    for (const bracket of brackets) {
      const bracketAmount = Math.min(remaining, bracket.limit - previousLimit);
      if (bracketAmount <= 0) break;
      tax += bracketAmount * bracket.rate;
      remaining -= bracketAmount;
      previousLimit = bracket.limit;
    }

    return tax;
  }

  // ========== Bank Export ==========

  static async exportBankFile(period: string, bankFormat: 'ACB' | 'VCB'): Promise<string> {
    const activeEmployees = await this.getActiveEmployees();
    const lines: string[] = [];

    if (bankFormat === 'VCB') {
      lines.push('STT,Số tài khoản,Tên người nhận,Số tiền,Nội dung');
      for (let index = 0; index < activeEmployees.length; index++) {
        const emp = activeEmployees[index];
        const payslip = await PayslipService.getByPeriod(emp.id, period);
        if (payslip) {
          lines.push(`${index + 1},${emp.idNumber},${emp.fullName},${payslip.netSalary},Luong thang ${period}`);
        }
      }
    } else {
      lines.push('STT|Ho ten|So tai khoan|So tien|Dien giai');
      for (let index = 0; index < activeEmployees.length; index++) {
        const emp = activeEmployees[index];
        const payslip = await PayslipService.getByPeriod(emp.id, period);
        if (payslip) {
          lines.push(`${index + 1}|${emp.fullName}|${emp.idNumber}|${payslip.netSalary}|Luong thang ${period}`);
        }
      }
    }

    return lines.join('\n');
  }

  // ========== Statistics ==========

  static async getHRStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    probationEmployees: number;
    resignedEmployees: number;
    departmentStats: { name: string; count: number }[];
  }> {
    const { data: employees } = await supabase
      .from('profiles')
      .select('status, department');

    if (!employees) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        probationEmployees: 0,
        resignedEmployees: 0,
        departmentStats: [],
      };
    }

    const departments = new Map<string, number>();
    employees.forEach(e => {
      const count = departments.get(e.department) || 0;
      departments.set(e.department, count + 1);
    });

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      probationEmployees: employees.filter(e => e.status === 'probation').length,
      resignedEmployees: employees.filter(e => e.status === 'inactive').length,
      departmentStats: Array.from(departments.entries()).map(([name, count]) => ({ name, count })),
    };
  }

  private static generateEmployeeId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 900) + 100;
    return `EMP-${year}-${random}`;
  }
}
