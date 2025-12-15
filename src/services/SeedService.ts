// Seed Service - initializes demo data
import { User, LeaveBalance, LeaveRequest, Payslip, Notification, OvertimeRequest } from '@/types';
import { StorageService } from './StorageService';

const SEEDED_KEY = 'data_seeded';

export class SeedService {
  static seedIfNeeded(): void {
    if (StorageService.get<boolean>(SEEDED_KEY)) {
      return;
    }

    this.seedUsers();
    this.seedLeaveBalances();
    this.seedLeaveRequests();
    this.seedOvertimeRequests();
    this.seedPayslips();
    this.seedNotifications();

    StorageService.set(SEEDED_KEY, true);
  }

  private static seedUsers(): void {
    const users: User[] = [
      {
        id: 'user-001',
        employeeId: 'EMP-2023-889',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        phone: '0909 123 456',
        role: 'employee',
        department: 'Phát triển sản phẩm (Product)',
        position: 'Senior Developer',
        location: 'Hồ Chí Minh, VN',
        startDate: '2021-01-15',
        contractType: 'Toàn thời gian (Không xác định thời hạn)',
        managerId: 'user-002',
        managerName: 'Trần Thị B',
        baseSalary: 25000000,
        status: 'active',
        idNumber: '079123456789',
      },
      {
        id: 'user-002',
        employeeId: 'EMP-2020-445',
        fullName: 'Trần Thị B',
        email: 'tranthib@company.com',
        phone: '0909 456 789',
        role: 'manager',
        department: 'Phát triển sản phẩm (Product)',
        position: 'Engineering Manager',
        location: 'Hồ Chí Minh, VN',
        startDate: '2020-03-01',
        contractType: 'Toàn thời gian (Không xác định thời hạn)',
        baseSalary: 45000000,
        status: 'active',
        idNumber: '079987654321',
      },
      {
        id: 'user-003',
        employeeId: 'EMP-2019-100',
        fullName: 'Lê Văn C',
        email: 'levanc@company.com',
        phone: '0909 789 012',
        role: 'admin',
        department: 'Nhân sự (HR)',
        position: 'HR Director',
        location: 'Hồ Chí Minh, VN',
        startDate: '2019-06-15',
        contractType: 'Toàn thời gian (Không xác định thời hạn)',
        baseSalary: 55000000,
        status: 'active',
        idNumber: '079111222333',
      },
      // Additional team members for manager
      {
        id: 'user-004',
        employeeId: 'EMP-2022-201',
        fullName: 'Phạm Văn D',
        email: 'phamvand@company.com',
        phone: '0909 111 222',
        role: 'employee',
        department: 'Phát triển sản phẩm (Product)',
        position: 'Junior Developer',
        location: 'Hồ Chí Minh, VN',
        startDate: '2022-06-01',
        contractType: 'Thử việc',
        managerId: 'user-002',
        managerName: 'Trần Thị B',
        baseSalary: 15000000,
        status: 'probation',
        idNumber: '079444555666',
      },
      {
        id: 'user-005',
        employeeId: 'EMP-2021-150',
        fullName: 'Hoàng Thị E',
        email: 'hoangthie@company.com',
        phone: '0909 333 444',
        role: 'employee',
        department: 'Phát triển sản phẩm (Product)',
        position: 'UI/UX Designer',
        location: 'Hồ Chí Minh, VN',
        startDate: '2021-09-15',
        contractType: 'Toàn thời gian (Không xác định thời hạn)',
        managerId: 'user-002',
        managerName: 'Trần Thị B',
        baseSalary: 22000000,
        status: 'active',
        idNumber: '079777888999',
      },
      {
        id: 'user-006',
        employeeId: 'EMP-2023-300',
        fullName: 'Vũ Văn F',
        email: 'vuvanf@company.com',
        phone: '0909 555 666',
        role: 'employee',
        department: 'Phát triển sản phẩm (Product)',
        position: 'QA Engineer',
        location: 'Hồ Chí Minh, VN',
        startDate: '2023-03-01',
        contractType: 'Toàn thời gian (Không xác định thời hạn)',
        managerId: 'user-002',
        managerName: 'Trần Thị B',
        baseSalary: 18000000,
        status: 'active',
        idNumber: '079000111222',
      },
    ];

    StorageService.set('users', users);
  }

  private static seedLeaveBalances(): void {
    const balances: LeaveBalance[] = [
      {
        id: 'balance-001',
        userId: 'user-001',
        annualTotal: 12,
        annualUsed: 3,
        sickTotal: 7,
        sickUsed: 1,
        unpaidUsed: 0,
      },
      {
        id: 'balance-002',
        userId: 'user-002',
        annualTotal: 15,
        annualUsed: 5,
        sickTotal: 7,
        sickUsed: 0,
        unpaidUsed: 0,
      },
      {
        id: 'balance-003',
        userId: 'user-003',
        annualTotal: 18,
        annualUsed: 2,
        sickTotal: 7,
        sickUsed: 0,
        unpaidUsed: 0,
      },
      {
        id: 'balance-004',
        userId: 'user-004',
        annualTotal: 12,
        annualUsed: 0,
        sickTotal: 7,
        sickUsed: 0,
        unpaidUsed: 0,
      },
      {
        id: 'balance-005',
        userId: 'user-005',
        annualTotal: 12,
        annualUsed: 2,
        sickTotal: 7,
        sickUsed: 1,
        unpaidUsed: 0,
      },
      {
        id: 'balance-006',
        userId: 'user-006',
        annualTotal: 12,
        annualUsed: 1,
        sickTotal: 7,
        sickUsed: 0,
        unpaidUsed: 0,
      },
    ];

    StorageService.set('leave_balances', balances);
  }

  private static seedLeaveRequests(): void {
    const requests: LeaveRequest[] = [
      {
        id: 'leave-001',
        userId: 'user-001',
        startDate: '2023-09-20',
        endDate: '2023-09-22',
        leaveType: 'annual',
        reason: 'Du lịch cùng gia đình',
        status: 'approved',
        approverId: 'user-002',
        approverName: 'Trần Thị B',
        approvedAt: '2023-09-16T14:00:00Z',
        createdAt: '2023-09-15T10:00:00Z',
        updatedAt: '2023-09-16T14:00:00Z',
        daysCount: 3,
      },
      {
        id: 'leave-002',
        userId: 'user-001',
        startDate: '2023-12-25',
        endDate: '2023-12-27',
        leaveType: 'annual',
        reason: 'Nghỉ Giáng sinh',
        status: 'pending',
        createdAt: '2023-12-10T09:00:00Z',
        updatedAt: '2023-12-10T09:00:00Z',
        daysCount: 3,
      },
      // Pending requests for manager to approve
      {
        id: 'leave-003',
        userId: 'user-004',
        startDate: '2023-12-20',
        endDate: '2023-12-21',
        leaveType: 'annual',
        reason: 'Về quê thăm gia đình',
        status: 'pending',
        createdAt: '2023-12-12T08:00:00Z',
        updatedAt: '2023-12-12T08:00:00Z',
        daysCount: 2,
      },
      {
        id: 'leave-004',
        userId: 'user-005',
        startDate: '2023-12-22',
        endDate: '2023-12-22',
        leaveType: 'sick',
        reason: 'Khám sức khỏe định kỳ',
        status: 'pending',
        createdAt: '2023-12-13T10:00:00Z',
        updatedAt: '2023-12-13T10:00:00Z',
        daysCount: 1,
      },
      {
        id: 'leave-005',
        userId: 'user-006',
        startDate: '2023-12-20',
        endDate: '2023-12-22',
        leaveType: 'annual',
        reason: 'Nghỉ phép cuối năm',
        status: 'pending',
        createdAt: '2023-12-14T09:00:00Z',
        updatedAt: '2023-12-14T09:00:00Z',
        daysCount: 3,
      },
      // Approved leaves for calendar
      {
        id: 'leave-006',
        userId: 'user-005',
        startDate: '2023-12-18',
        endDate: '2023-12-19',
        leaveType: 'annual',
        reason: 'Việc cá nhân',
        status: 'approved',
        approverId: 'user-002',
        approverName: 'Trần Thị B',
        approvedAt: '2023-12-11T10:00:00Z',
        createdAt: '2023-12-10T08:00:00Z',
        updatedAt: '2023-12-11T10:00:00Z',
        daysCount: 2,
      },
    ];

    StorageService.set('leave_requests', requests);
  }

  private static seedOvertimeRequests(): void {
    const requests: OvertimeRequest[] = [
      {
        id: 'ot-001',
        userId: 'user-001',
        date: '2023-12-16',
        startTime: '18:00',
        endTime: '21:00',
        reason: 'Hoàn thành deadline dự án',
        status: 'pending',
        createdAt: '2023-12-14T15:00:00Z',
        hoursCount: 3,
      },
      {
        id: 'ot-002',
        userId: 'user-004',
        date: '2023-12-17',
        startTime: '09:00',
        endTime: '14:00',
        reason: 'Fix bug khẩn cấp',
        status: 'pending',
        createdAt: '2023-12-15T08:00:00Z',
        hoursCount: 5,
      },
      {
        id: 'ot-003',
        userId: 'user-006',
        date: '2023-12-18',
        startTime: '18:00',
        endTime: '20:00',
        reason: 'Testing release mới',
        status: 'pending',
        createdAt: '2023-12-15T10:00:00Z',
        hoursCount: 2,
      },
      // Approved OT for calendar
      {
        id: 'ot-004',
        userId: 'user-001',
        date: '2023-12-15',
        startTime: '18:00',
        endTime: '22:00',
        reason: 'Deploy production',
        status: 'approved',
        approverId: 'user-002',
        approverName: 'Trần Thị B',
        approvedAt: '2023-12-14T09:00:00Z',
        createdAt: '2023-12-13T16:00:00Z',
        hoursCount: 4,
      },
    ];

    StorageService.set('overtime_requests', requests);
  }

  private static seedPayslips(): void {
    const payslips: Payslip[] = [
      {
        id: 'payslip-001',
        userId: 'user-001',
        period: '2023-10',
        periodLabel: 'Tháng 10, 2023',
        baseSalary: 25000000,
        overtime: 2500000,
        bonus: 1000000,
        allowances: 500000,
        socialInsurance: 2000000,
        healthInsurance: 375000,
        tax: 1500000,
        deductions: 0,
        netSalary: 25125000,
        status: 'paid',
        paidDate: '2023-10-30',
        createdAt: '2023-10-28T00:00:00Z',
      },
      {
        id: 'payslip-002',
        userId: 'user-001',
        period: '2023-09',
        periodLabel: 'Tháng 09, 2023',
        baseSalary: 25000000,
        overtime: 1500000,
        bonus: 0,
        allowances: 500000,
        socialInsurance: 2000000,
        healthInsurance: 375000,
        tax: 1200000,
        deductions: 0,
        netSalary: 23425000,
        status: 'paid',
        paidDate: '2023-09-30',
        createdAt: '2023-09-28T00:00:00Z',
      },
      {
        id: 'payslip-003',
        userId: 'user-001',
        period: '2023-08',
        periodLabel: 'Tháng 08, 2023',
        baseSalary: 25000000,
        overtime: 2000000,
        bonus: 500000,
        allowances: 500000,
        socialInsurance: 2000000,
        healthInsurance: 375000,
        tax: 1350000,
        deductions: 0,
        netSalary: 24275000,
        status: 'paid',
        paidDate: '2023-08-31',
        createdAt: '2023-08-29T00:00:00Z',
      },
    ];

    StorageService.set('payslips', payslips);
  }

  private static seedNotifications(): void {
    const notifications: Notification[] = [
      {
        id: 'notif-001',
        userId: 'user-001',
        title: 'Đơn nghỉ phép được duyệt',
        message: 'Đơn xin nghỉ từ 20/09 đến 22/09 đã được duyệt bởi Trần Thị B',
        type: 'leave',
        isRead: true,
        createdAt: '2023-09-16T14:00:00Z',
        relatedId: 'leave-001',
      },
      {
        id: 'notif-002',
        userId: 'user-001',
        title: 'Phiếu lương tháng 10',
        message: 'Phiếu lương tháng 10/2023 đã sẵn sàng. Vui lòng kiểm tra.',
        type: 'payroll',
        isRead: false,
        createdAt: '2023-10-28T10:00:00Z',
        relatedId: 'payslip-001',
      },
    ];

    StorageService.set('notifications', notifications);
  }

  static reset(): void {
    StorageService.remove(SEEDED_KEY);
    StorageService.remove('users');
    StorageService.remove('leave_balances');
    StorageService.remove('leave_requests');
    StorageService.remove('overtime_requests');
    StorageService.remove('payslips');
    StorageService.remove('notifications');
    StorageService.remove('current_user');
    this.seedIfNeeded();
  }
}
