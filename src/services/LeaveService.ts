// Leave Service - manages leave requests CRUD operations (Supabase version)
// Maps to localStorage key: hr_portal_leave_requests
import { LeaveRequest, LeaveStatus, LeaveType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { UserService } from './UserService';
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';

// Helper to convert DB row to LeaveRequest
const mapDbToLeaveRequest = (row: any): LeaveRequest => ({
  id: row.id,
  userId: row.user_id,
  startDate: row.start_date,
  endDate: row.end_date,
  leaveType: row.leave_type as LeaveType,
  reason: row.reason || '',
  status: row.status as LeaveStatus,
  approverId: row.approver_id,
  approverName: row.approver?.full_name,
  approvedAt: row.approved_at,
  rejectReason: row.reject_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  daysCount: row.days_count,
});

export class LeaveService {
  static async getAll(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, approver:approver_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching leave requests:', error);
      return [];
    }
    return (data || []).map(mapDbToLeaveRequest);
  }

  static async getById(id: string): Promise<LeaveRequest | null> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToLeaveRequest(data);
  }

  static async getByUserId(userId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToLeaveRequest);
  }

  static async getPendingRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToLeaveRequest);
  }

  static async create(data: {
    userId: string;
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    reason: string;
  }): Promise<LeaveRequest | { error: string }> {
    // Validate leave balance
    const balance = await UserService.getLeaveBalance(data.userId);
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

    const { data: inserted, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: data.userId,
        start_date: data.startDate,
        end_date: data.endDate,
        leave_type: data.leaveType,
        reason: data.reason,
        status: 'pending',
        days_count: daysCount,
      })
      .select('*, approver:approver_id(full_name)')
      .single();

    if (error) {
      console.error('Error creating leave request:', error);
      return { error: 'Không thể tạo đơn xin nghỉ phép' };
    }

    return mapDbToLeaveRequest(inserted);
  }

  static async update(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
    const dbUpdates: any = {};
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.leaveType !== undefined) dbUpdates.leave_type = updates.leaveType;
    if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.approverId !== undefined) dbUpdates.approver_id = updates.approverId;
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
    if (updates.rejectReason !== undefined) dbUpdates.reject_reason = updates.rejectReason;
    if (updates.daysCount !== undefined) dbUpdates.days_count = updates.daysCount;

    const { data, error } = await supabase
      .from('leave_requests')
      .update(dbUpdates)
      .eq('id', id)
      .select('*, approver:approver_id(full_name)')
      .single();

    if (error) {
      console.error('Error updating leave request:', error);
      return null;
    }
    return mapDbToLeaveRequest(data);
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async approve(id: string): Promise<LeaveRequest | null> {
    const request = await this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Update leave balance
    const balance = await UserService.getLeaveBalance(request.userId);
    if (balance) {
      if (request.leaveType === 'annual') {
        await UserService.updateLeaveBalance(request.userId, {
          annualUsed: balance.annualUsed + request.daysCount,
        });
      } else if (request.leaveType === 'sick') {
        await UserService.updateLeaveBalance(request.userId, {
          sickUsed: balance.sickUsed + request.daysCount,
        });
      } else if (request.leaveType === 'unpaid') {
        await UserService.updateLeaveBalance(request.userId, {
          unpaidUsed: balance.unpaidUsed + request.daysCount,
        });
      }
    }

    // Create notification
    await NotificationService.create({
      userId: request.userId,
      title: 'Đơn nghỉ phép được duyệt',
      message: `Đơn xin nghỉ từ ${request.startDate} đến ${request.endDate} đã được duyệt bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'approved',
      approverId: approver.id,
      approvedAt: new Date().toISOString(),
    });
  }

  static async reject(id: string, rejectReason?: string): Promise<LeaveRequest | null> {
    const request = await this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification
    await NotificationService.create({
      userId: request.userId,
      title: 'Đơn nghỉ phép bị từ chối',
      message: `Đơn xin nghỉ từ ${request.startDate} đến ${request.endDate} đã bị từ chối bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'rejected',
      approverId: approver.id,
      approvedAt: new Date().toISOString(),
      rejectReason,
    });
  }

  static calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  static async checkTeamLeaveConflict(userId: string, startDate: string, endDate: string): Promise<number> {
    const user = await UserService.getById(userId);
    if (!user) return 0;

    const teamMembers = await UserService.getByDepartment(user.department);
    const teamMemberIds = teamMembers.map(m => m.id);

    const { data } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .in('user_id', teamMemberIds)
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    return (data || []).length;
  }

  private static datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
  }
}
