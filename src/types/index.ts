// Core types for the HR Portal

export type UserRole = 'employee' | 'manager' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'probation';

export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  department: string;
  position: string;
  location: string;
  startDate: string;
  contractType: string;
  managerId?: string;
  managerName?: string;
  baseSalary: number;
  status: UserStatus;
  idNumber: string; // CMND/CCCD
}

export interface LeaveBalance {
  id: string;
  userId: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  unpaidUsed: number;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  daysCount: number;
}

export type PayslipStatus = 'pending' | 'paid';

export interface Payslip {
  id: string;
  userId: string;
  period: string; // e.g., "2023-10"
  periodLabel: string; // e.g., "Tháng 10, 2023"
  baseSalary: number;
  overtime: number;
  bonus: number;
  allowances: number;
  socialInsurance: number;
  healthInsurance: number;
  tax: number;
  deductions: number;
  netSalary: number;
  status: PayslipStatus;
  paidDate?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'payroll' | 'system' | 'approval';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface OvertimeRequest {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  createdAt: string;
  hoursCount: number;
}
