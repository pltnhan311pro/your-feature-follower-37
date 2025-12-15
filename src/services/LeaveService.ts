// Leave Service - manages leave requests CRUD operations
import { LeaveRequest, LeaveStatus, LeaveType } from '@/types';
import { StorageService } from './StorageService';
import { UserService } from './UserService';
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';

const LEAVE_REQUESTS_KEY = 'leave_requests';

export class LeaveService {
  static getAll(): LeaveRequest[] {
    return StorageService.getAll<LeaveRequest>(LEAVE_REQUESTS_KEY);
  }

  static getById(id: string): LeaveRequest | null {
    return StorageService.findById<LeaveRequest>(LEAVE_REQUESTS_KEY, id);
  }

  static getByUserId(userId: string): LeaveRequest[] {
    return StorageService.findByField<LeaveRequest>(LEAVE_REQUESTS_KEY, 'userId', userId);
  }

  static getPendingRequests(): LeaveRequest[] {
    return StorageService.findByField<LeaveRequest>(LEAVE_REQUESTS_KEY, 'status', 'pending');
  }

  static create(data: {
    userId: string;
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    reason: string;
  }): LeaveRequest | { error: string } {
    // Validate leave balance
    const balance = UserService.getLeaveBalance(data.userId);
    if (!balance) {
      return { error: 'Không tìm thấy thông tin phép của nhân viên' };
    }

    const daysCount = this.calculateDays(data.startDate, data.endDate);

    if (data.leaveType === 'annual') {
      const remaining = balance.annualTotal - balance.annualUsed;
      if (daysCount > remaining) {
        return { error: `Số ngày phép còn lại không đủ. Còn lại: ${remaining} ngày` };
      }
    } else if (data.leaveType === 'sick') {
      const remaining = balance.sickTotal - balance.sickUsed;
      if (daysCount > remaining) {
        return { error: `Số ngày phép bệnh còn lại không đủ. Còn lại: ${remaining} ngày` };
      }
    }

    const leaveRequest: LeaveRequest = {
      id: crypto.randomUUID(),
      userId: data.userId,
      startDate: data.startDate,
      endDate: data.endDate,
      leaveType: data.leaveType,
      reason: data.reason,
      status: 'pending',
      daysCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.addItem(LEAVE_REQUESTS_KEY, leaveRequest);
    return leaveRequest;
  }

  static update(id: string, updates: Partial<LeaveRequest>): LeaveRequest | null {
    return StorageService.updateItem<LeaveRequest>(LEAVE_REQUESTS_KEY, id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  static delete(id: string): boolean {
    return StorageService.deleteItem<LeaveRequest>(LEAVE_REQUESTS_KEY, id);
  }

  static approve(id: string): LeaveRequest | null {
    const request = this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Update leave balance
    const balance = UserService.getLeaveBalance(request.userId);
    if (balance) {
      if (request.leaveType === 'annual') {
        UserService.updateLeaveBalance(request.userId, {
          annualUsed: balance.annualUsed + request.daysCount,
        });
      } else if (request.leaveType === 'sick') {
        UserService.updateLeaveBalance(request.userId, {
          sickUsed: balance.sickUsed + request.daysCount,
        });
      } else if (request.leaveType === 'unpaid') {
        UserService.updateLeaveBalance(request.userId, {
          unpaidUsed: balance.unpaidUsed + request.daysCount,
        });
      }
    }

    // Create notification
    NotificationService.create({
      userId: request.userId,
      title: 'Đơn nghỉ phép được duyệt',
      message: `Đơn xin nghỉ từ ${request.startDate} đến ${request.endDate} đã được duyệt bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'approved',
      approverId: approver.id,
      approverName: approver.fullName,
    });
  }

  static reject(id: string): LeaveRequest | null {
    const request = this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification
    NotificationService.create({
      userId: request.userId,
      title: 'Đơn nghỉ phép bị từ chối',
      message: `Đơn xin nghỉ từ ${request.startDate} đến ${request.endDate} đã bị từ chối bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'rejected',
      approverId: approver.id,
      approverName: approver.fullName,
    });
  }

  static calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  static checkTeamLeaveConflict(userId: string, startDate: string, endDate: string): number {
    // Get user's department
    const user = UserService.getById(userId);
    if (!user) return 0;

    const teamMembers = UserService.getByDepartment(user.department);
    const approvedLeaves = this.getAll().filter(
      leave => leave.status === 'approved' &&
      teamMembers.some(m => m.id === leave.userId) &&
      this.datesOverlap(leave.startDate, leave.endDate, startDate, endDate)
    );

    return approvedLeaves.length;
  }

  private static datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
  }
}
