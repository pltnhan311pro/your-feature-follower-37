// Overtime Service - manages overtime requests CRUD operations (Supabase version)
// Maps to localStorage key: hr_portal_overtime_requests
import { OvertimeRequest, LeaveStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { AuthService } from './AuthService';
import { NotificationService } from './NotificationService';
import { UserService } from './UserService';

// Helper to convert DB row to OvertimeRequest
const mapDbToOvertimeRequest = (row: any): OvertimeRequest => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  reason: row.reason || '',
  status: row.status as LeaveStatus,
  approverId: row.approver_id,
  approverName: row.approver?.full_name,
  approvedAt: row.approved_at,
  rejectReason: row.reject_reason,
  createdAt: row.created_at,
  hoursCount: Number(row.hours_count),
});

export class OvertimeService {
  static async getAll(): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching overtime requests:', error);
      return [];
    }
    return (data || []).map(mapDbToOvertimeRequest);
  }

  static async getById(id: string): Promise<OvertimeRequest | null> {
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToOvertimeRequest(data);
  }

  static async getByUserId(userId: string): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToOvertimeRequest);
  }

  static async getPendingRequests(): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToOvertimeRequest);
  }

  static async getPendingForTeam(managerId: string): Promise<OvertimeRequest[]> {
    const teamMembers = await UserService.getByManager(managerId);
    const teamMemberIds = teamMembers.map(m => m.id);
    
    if (teamMemberIds.length === 0) return [];

    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('status', 'pending')
      .in('user_id', teamMemberIds)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToOvertimeRequest);
  }

  static async getByTeam(managerId: string): Promise<OvertimeRequest[]> {
    const teamMembers = await UserService.getByManager(managerId);
    const teamMemberIds = teamMembers.map(m => m.id);
    
    if (teamMemberIds.length === 0) return [];

    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .in('user_id', teamMemberIds)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToOvertimeRequest);
  }

  static calculateHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  }

  static async create(data: {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<OvertimeRequest | { error: string }> {
    const hours = this.calculateHours(data.startTime, data.endTime);
    if (hours <= 0) {
      return { error: 'Giờ kết thúc phải sau giờ bắt đầu' };
    }

    const { data: inserted, error } = await supabase
      .from('overtime_requests')
      .insert({
        user_id: data.userId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        reason: data.reason,
        status: 'pending',
        hours_count: hours,
      })
      .select('*, approver:approver_id(full_name)')
      .single();

    if (error) {
      console.error('Error creating overtime request:', error);
      return { error: 'Không thể tạo đơn OT' };
    }

    // Notify manager
    const user = await UserService.getById(data.userId);
    if (user?.managerId) {
      await NotificationService.create({
        userId: user.managerId,
        title: 'Đơn OT mới cần duyệt',
        message: `${user.fullName} đã gửi đơn đăng ký OT ngày ${data.date}`,
        type: 'leave',
        relatedId: inserted.id,
      });
    }

    return mapDbToOvertimeRequest(inserted);
  }

  static async update(id: string, updates: Partial<OvertimeRequest>): Promise<OvertimeRequest | null> {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.approverId !== undefined) dbUpdates.approver_id = updates.approverId;
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
    if (updates.rejectReason !== undefined) dbUpdates.reject_reason = updates.rejectReason;
    if (updates.hoursCount !== undefined) dbUpdates.hours_count = updates.hoursCount;

    const { data, error } = await supabase
      .from('overtime_requests')
      .update(dbUpdates)
      .eq('id', id)
      .select('*, approver:approver_id(full_name)')
      .single();

    if (error) {
      console.error('Error updating overtime request:', error);
      return null;
    }
    return mapDbToOvertimeRequest(data);
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('overtime_requests')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async approve(id: string): Promise<OvertimeRequest | null> {
    const request = await this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification for employee
    await NotificationService.create({
      userId: request.userId,
      title: 'Đơn OT được duyệt',
      message: `Đơn OT ngày ${request.date} đã được duyệt bởi ${approver.fullName}`,
      type: 'leave',
      relatedId: id,
    });

    return this.update(id, {
      status: 'approved',
      approverId: approver.id,
      approvedAt: new Date().toISOString(),
    });
  }

  static async reject(id: string, rejectReason?: string): Promise<OvertimeRequest | null> {
    const request = await this.getById(id);
    if (!request || request.status !== 'pending') return null;

    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return null;

    // Create notification for employee
    await NotificationService.create({
      userId: request.userId,
      title: 'Đơn OT bị từ chối',
      message: `Đơn OT ngày ${request.date} đã bị từ chối bởi ${approver.fullName}${rejectReason ? `. Lý do: ${rejectReason}` : ''}`,
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

  static async bulkApprove(ids: string[]): Promise<OvertimeRequest[]> {
    const approver = AuthService.getCurrentUser();
    if (!approver || !AuthService.canApproveLeave()) return [];

    const approved: OvertimeRequest[] = [];
    for (const id of ids) {
      const result = await this.approve(id);
      if (result) approved.push(result);
    }

    return approved;
  }

  static async getApprovalHistory(approverId: string): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from('overtime_requests')
      .select('*, approver:approver_id(full_name)')
      .eq('approver_id', approverId)
      .neq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToOvertimeRequest);
  }
}
