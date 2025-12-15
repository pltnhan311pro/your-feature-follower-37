// HR Admin Service - manages HR-specific operations
import { User, Payslip, LeaveRequest, OvertimeRequest } from '@/types';
import { StorageService } from './StorageService';
import { UserService } from './UserService';
import { PayslipService } from './PayslipService';
import { LeaveService } from './LeaveService';
import { OvertimeService } from './OvertimeService';

const EMPLOYEE_HISTORY_KEY = 'employee_history';
const PAYROLL_CONFIG_KEY = 'payroll_config';
const PAYROLL_RUN_KEY = 'payroll_runs';

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
  otMultiplier: number; // Hệ số OT (e.g., 1.5)
  socialInsuranceRate: number; // BHXH (e.g., 0.08)
  healthInsuranceRate: number; // BHYT (e.g., 0.015)
  unemploymentInsuranceRate: number; // BHTN (e.g., 0.01)
  personalDeduction: number; // Giảm trừ cá nhân
  dependentDeduction: number; // Giảm trừ người phụ thuộc
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

export class HRService {
  // ========== Employee Management ==========
  
  static getAllEmployees(): User[] {
    return UserService.getAll();
  }

  static getActiveEmployees(): User[] {
    return UserService.getAll().filter(u => u.status !== 'inactive');
  }

  static searchEmployees(query: string, filters: {
    department?: string;
    status?: string;
    position?: string;
  } = {}): User[] {
    let employees = this.getAllEmployees();

    // Search by name, email, employeeId
    if (query) {
      const lowerQuery = query.toLowerCase();
      employees = employees.filter(e => 
        e.fullName.toLowerCase().includes(lowerQuery) ||
        e.email.toLowerCase().includes(lowerQuery) ||
        e.employeeId.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by department
    if (filters.department) {
      employees = employees.filter(e => e.department === filters.department);
    }

    // Filter by status
    if (filters.status) {
      employees = employees.filter(e => e.status === filters.status);
    }

    // Filter by position
    if (filters.position) {
      employees = employees.filter(e => 
        e.position.toLowerCase().includes(filters.position.toLowerCase())
      );
    }

    return employees;
  }

  static createEmployee(data: Omit<User, 'id' | 'employeeId'>, performedBy: { id: string; name: string }): User {
    const employeeId = this.generateEmployeeId();
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      employeeId,
      status: data.status || 'active',
    };

    UserService.create(user);

    // Log history
    this.addHistoryEntry({
      userId: user.id,
      type: 'created',
      description: `Nhân viên ${user.fullName} được tạo với mã ${employeeId}`,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
    });

    return user;
  }

  static updateEmployee(
    id: string, 
    updates: Partial<User>, 
    performedBy: { id: string; name: string }
  ): User | null {
    const currentUser = UserService.getById(id);
    if (!currentUser) return null;

    // Track specific changes for history
    if (updates.position && updates.position !== currentUser.position) {
      this.addHistoryEntry({
        userId: id,
        type: 'promoted',
        description: `Thay đổi chức vụ`,
        previousValue: currentUser.position,
        newValue: updates.position,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    if (updates.department && updates.department !== currentUser.department) {
      this.addHistoryEntry({
        userId: id,
        type: 'department_change',
        description: `Chuyển phòng ban`,
        previousValue: currentUser.department,
        newValue: updates.department,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    if (updates.status && updates.status !== currentUser.status) {
      this.addHistoryEntry({
        userId: id,
        type: 'status_change',
        description: `Thay đổi trạng thái`,
        previousValue: currentUser.status,
        newValue: updates.status,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    // Log general update if no specific changes
    const hasSpecificChanges = updates.position || updates.department || updates.status;
    if (!hasSpecificChanges) {
      this.addHistoryEntry({
        userId: id,
        type: 'updated',
        description: `Cập nhật thông tin cá nhân`,
        performedBy: performedBy.id,
        performedByName: performedBy.name,
      });
    }

    return UserService.update(id, updates);
  }

  static softDeleteEmployee(id: string, performedBy: { id: string; name: string }): User | null {
    const user = UserService.getById(id);
    if (!user) return null;

    this.addHistoryEntry({
      userId: id,
      type: 'status_change',
      description: `Nhân viên nghỉ việc`,
      previousValue: user.status,
      newValue: 'inactive',
      performedBy: performedBy.id,
      performedByName: performedBy.name,
    });

    return UserService.update(id, { status: 'inactive' });
  }

  // ========== Employee History / Timeline ==========

  static addHistoryEntry(data: Omit<EmployeeHistoryEntry, 'id' | 'createdAt'>): EmployeeHistoryEntry {
    const entry: EmployeeHistoryEntry = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    StorageService.addItem(EMPLOYEE_HISTORY_KEY, entry);
    return entry;
  }

  static getEmployeeHistory(userId: string): EmployeeHistoryEntry[] {
    const all = StorageService.getAll<EmployeeHistoryEntry>(EMPLOYEE_HISTORY_KEY);
    return all
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ========== Payroll Configuration ==========

  static getPayrollConfig(): PayrollConfig {
    const config = StorageService.get<PayrollConfig>(PAYROLL_CONFIG_KEY);
    if (config) return config;

    // Default config based on Vietnamese law
    const defaultConfig: PayrollConfig = {
      otMultiplier: 1.5,
      socialInsuranceRate: 0.08, // 8%
      healthInsuranceRate: 0.015, // 1.5%
      unemploymentInsuranceRate: 0.01, // 1%
      personalDeduction: 11000000, // 11 triệu
      dependentDeduction: 4400000, // 4.4 triệu
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
    StorageService.set(PAYROLL_CONFIG_KEY, defaultConfig);
    return defaultConfig;
  }

  static updatePayrollConfig(updates: Partial<PayrollConfig>, updatedBy: string): PayrollConfig {
    const current = this.getPayrollConfig();
    const updated: PayrollConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    StorageService.set(PAYROLL_CONFIG_KEY, updated);
    return updated;
  }

  // ========== Payroll Run ==========

  static getPayrollRuns(): PayrollRun[] {
    return StorageService.getAll<PayrollRun>(PAYROLL_RUN_KEY)
      .sort((a, b) => b.period.localeCompare(a.period));
  }

  static getPayrollRun(period: string): PayrollRun | null {
    const runs = this.getPayrollRuns();
    return runs.find(r => r.period === period) || null;
  }

  static runPayroll(period: string, runBy: { id: string; name: string }): PayrollRun {
    const activeEmployees = this.getActiveEmployees();
    const config = this.getPayrollConfig();
    
    // Get month/year for period label
    const [year, month] = period.split('-');
    const periodLabel = `Tháng ${month}, ${year}`;

    // Create or update payroll run
    let payrollRun = this.getPayrollRun(period);
    if (!payrollRun) {
      payrollRun = {
        id: crypto.randomUUID(),
        period,
        periodLabel,
        status: 'processing',
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        runAt: new Date().toISOString(),
        runBy: runBy.name,
      };
      StorageService.addItem(PAYROLL_RUN_KEY, payrollRun);
    } else {
      payrollRun.status = 'processing';
      payrollRun.runAt = new Date().toISOString();
      payrollRun.runBy = runBy.name;
      StorageService.updateItem(PAYROLL_RUN_KEY, payrollRun.id, payrollRun);
    }

    let totalGross = 0;
    let totalNet = 0;

    // Calculate payroll for each active employee
    for (const employee of activeEmployees) {
      // Get approved OT hours for this period
      const otRequests = OvertimeService.getByUserId(employee.id)
        .filter(r => r.status === 'approved' && r.date.startsWith(period));
      const totalOTHours = otRequests.reduce((sum, r) => sum + r.hoursCount, 0);

      // Calculate OT pay (hourly rate * OT hours * multiplier)
      const hourlyRate = employee.baseSalary / 176; // ~22 working days * 8 hours
      const otPay = Math.round(hourlyRate * totalOTHours * config.otMultiplier);

      // Get approved leave days (to deduct if unpaid)
      const leaveRequests = LeaveService.getByUserId(employee.id)
        .filter(r => r.status === 'approved' && r.leaveType === 'unpaid');
      const unpaidLeaveDays = leaveRequests.reduce((sum, r) => sum + r.daysCount, 0);
      const dailyRate = employee.baseSalary / 22;
      const unpaidDeduction = unpaidLeaveDays * dailyRate;

      // Calculate deductions
      const grossSalary = employee.baseSalary + otPay;
      const socialInsurance = Math.round(grossSalary * config.socialInsuranceRate);
      const healthInsurance = Math.round(grossSalary * config.healthInsuranceRate);
      
      // Calculate tax (simplified)
      const taxableIncome = grossSalary - socialInsurance - healthInsurance - config.personalDeduction;
      const tax = taxableIncome > 0 ? Math.round(this.calculateTax(taxableIncome)) : 0;

      const netSalary = grossSalary - socialInsurance - healthInsurance - tax - unpaidDeduction;

      // Check if payslip exists for this period
      const existingPayslip = PayslipService.getByPeriod(employee.id, period);
      if (existingPayslip) {
        PayslipService.update(existingPayslip.id, {
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
        PayslipService.create({
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
    const updatedRun: PayrollRun = {
      ...payrollRun,
      status: 'completed',
      totalEmployees: activeEmployees.length,
      totalGrossSalary: totalGross,
      totalNetSalary: totalNet,
      completedAt: new Date().toISOString(),
    };
    StorageService.updateItem(PAYROLL_RUN_KEY, payrollRun.id, updatedRun);

    return updatedRun;
  }

  // Progressive tax calculation (Vietnam rates)
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

  static exportBankFile(period: string, bankFormat: 'ACB' | 'VCB'): string {
    const activeEmployees = this.getActiveEmployees();
    const lines: string[] = [];

    if (bankFormat === 'VCB') {
      // VCB format: STT,Số tài khoản,Tên người nhận,Số tiền,Nội dung
      lines.push('STT,Số tài khoản,Tên người nhận,Số tiền,Nội dung');
      activeEmployees.forEach((emp, index) => {
        const payslip = PayslipService.getByPeriod(emp.id, period);
        if (payslip) {
          lines.push(`${index + 1},${emp.idNumber},${emp.fullName},${payslip.netSalary},Luong thang ${period}`);
        }
      });
    } else {
      // ACB format
      lines.push('STT|Ho ten|So tai khoan|So tien|Dien giai');
      activeEmployees.forEach((emp, index) => {
        const payslip = PayslipService.getByPeriod(emp.id, period);
        if (payslip) {
          lines.push(`${index + 1}|${emp.fullName}|${emp.idNumber}|${payslip.netSalary}|Luong thang ${period}`);
        }
      });
    }

    return lines.join('\n');
  }

  // ========== Statistics ==========

  static getHRStats(): {
    totalEmployees: number;
    activeEmployees: number;
    probationEmployees: number;
    resignedEmployees: number;
    departmentStats: { name: string; count: number }[];
  } {
    const employees = this.getAllEmployees();
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
