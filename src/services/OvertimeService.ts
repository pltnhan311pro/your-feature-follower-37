// Overtime Service - manages overtime requests CRUD operations
import { OvertimeRequest, LeaveStatus } from '@/types';
import { StorageService } from './StorageService';
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';
import { UserService } from './UserService';

const OT_REQUESTS_KEY = 'overtime_requests';

export class OvertimeService {
  static getAll(): OvertimeRequest[] {
    return StorageService.getAll<OvertimeRequest>(OT_REQUESTS_KEY);
  }

  static getById(id: string): OvertimeRequest | null {
    return StorageService.findById<OvertimeRequest>(OT_REQUESTS_KEY, id);
  }

  static getByUserId(userId: string): OvertimeRequest[] {
    const all = StorageService.getAll<OvertimeRequest>(OT_REQUESTS_KEY);
    return all.filter(r => r.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static getPendingRequests(): OvertimeRequest[] {
    return StorageService.findByField<OvertimeRequest>(OT_REQUESTS_KEY, 'status', 'pending');
  }

  static getPendingForTeam(managerId: string): OvertimeRequest[] {
    const teamMembers = UserService.getByManager(managerId);
    const teamMemberIds = teamMembers.map(m => m.id);
    const pendingRequests = this.getPendingRequests();
    return pendingRequests.filter(r => teamMemberIds.includes(r.userId));
  }

  static getByTeam(managerId: string): OvertimeRequest[] {
    const teamMembers = UserService.getByManager(managerId);
    const teamMemberIds = teamMembers.map(m => m.id);
    const allRequests = this.getAll();
    return allRequests.filter(r => teamMemberIds.includes(r.userId));
  }

  static calculateHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  }

  static create(data: {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): OvertimeRequest | { error: string } {
    const hours = this.calculateHours(data.startTime, data.endTime);
    if (hours <= 0) {
      return { error: 'Giờ kết thúc phải sau giờ bắt đầu' };
    }

    const otRequest: OvertimeRequest = {
      id: crypto.randomUUID(),
      userId: data.userId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      hoursCount: hours,
    };

    StorageService.addItem(OT_REQUESTS_KEY, otRequest);

    // Notify manager
    const user = UserService.getById(data.userId);
    if (user?.managerId) {
      NotificationService.create({
        userId: user.managerId,
        title: 'Đơn OT mới cần duyệt',
        message: `${user.fullName} đã gửi đơn đăng ký OT ngày ${data.date}`,
        type: 'leave',
        relatedId: otRequest.id,
      });
    }

    return otRequest;
  }

  static update(id: string, updates: Partial<OvertimeRequest>): OvertimeRequest | null {
    return StorageService.updateItem<OvertimeRequest>(OT_REQUESTS_KEY, id, updates);
  }

  static delete(id: string): boolean {
    return StorageService.deleteItem<OvertimeRequest>(OT_REQUESTS_KEY, id);
  }

  static approve(id: string, rejectReason?: string): OvertimeRequest | null {
    const request = this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification for employee
    NotificationService.create({
      userId: request.userId,
      title: 'Đơn OT được duyệt',
      message: `Đơn OT ngày ${request.date} đã được duyệt bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'approved',
      approverId: approver.id,
      approverName: approver.fullName,
    });
  }

  static reject(id: string, rejectReason?: string): OvertimeRequest | null {
    const request = this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification for employee
    NotificationService.create({
      userId: request.userId,
      title: 'Đơn OT bị từ chối',
      message: `Đơn OT ngày ${request.date} đã bị từ chối bởi ${approver.fullName}${rejectReason ? `. Lý do: ${rejectReason}` : ''}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'rejected',
      approverId: approver.id,
      approverName: approver.fullName,
    });
  }

  static bulkApprove(ids: string[]): OvertimeRequest[] {
    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return [];

    const approved: OvertimeRequest[] = [];
    ids.forEach(id => {
      const result = this.approve(id);
      if (result) approved.push(result);
    });

    return approved;
  }

  static getApprovalHistory(approverId: string): OvertimeRequest[] {
    const all = this.getAll();
    return all
      .filter(r => r.approverId === approverId && r.status !== 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
