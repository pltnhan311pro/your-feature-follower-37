// Manager Service - manages manager-specific operations
import { User, LeaveRequest, OvertimeRequest } from '@/types';
import { UserService } from './UserService';
import { LeaveService } from './LeaveService';
import { OvertimeService } from './OvertimeService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  probationMembers: number;
  resignedMembers: number;
}

export interface TeamCalendarItem {
  date: Date;
  items: {
    userId: string;
    userName: string;
    type: 'leave' | 'ot';
    detail: string;
  }[];
}

export interface LeaveAlert {
  date: string;
  dateFormatted: string;
  count: number;
  percentage: number;
  employees: string[];
}

export interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'leave' | 'ot';
  date: string;
  duration: string;
  reason: string;
  status: 'pending';
  createdAt: string;
  original: LeaveRequest | OvertimeRequest;
}

export class ManagerService {
  // Get team members for a manager
  static getTeamMembers(managerId: string): User[] {
    return UserService.getByManager(managerId);
  }

  // Get team statistics
  static getTeamStats(managerId: string): TeamStats {
    const members = this.getTeamMembers(managerId);
    
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      probationMembers: members.filter(m => m.contractType.toLowerCase().includes('thử việc')).length,
      resignedMembers: members.filter(m => m.status === 'inactive').length,
    };
  }

  // Get team calendar for current week
  static getTeamCalendar(managerId: string, date: Date = new Date()): TeamCalendarItem[] {
    const members = this.getTeamMembers(managerId);
    const memberIds = members.map(m => m.id);
    const memberMap = new Map(members.map(m => [m.id, m.fullName]));

    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Get all leave requests for team
    const allLeaves = LeaveService.getAll().filter(
      l => memberIds.includes(l.userId) && l.status === 'approved'
    );

    // Get all OT requests for team
    const allOT = OvertimeService.getAll().filter(
      ot => memberIds.includes(ot.userId) && ot.status === 'approved'
    );

    return days.map(day => {
      const items: TeamCalendarItem['items'] = [];

      // Check leaves
      allLeaves.forEach(leave => {
        const startDate = parseISO(leave.startDate);
        const endDate = parseISO(leave.endDate);
        if (isWithinInterval(day, { start: startDate, end: endDate })) {
          const leaveTypeMap: Record<string, string> = {
            annual: 'Nghỉ phép năm',
            sick: 'Nghỉ ốm',
            unpaid: 'Nghỉ không lương',
          };
          items.push({
            userId: leave.userId,
            userName: memberMap.get(leave.userId) || 'Unknown',
            type: 'leave',
            detail: leaveTypeMap[leave.leaveType] || leave.leaveType,
          });
        }
      });

      // Check OT
      allOT.forEach(ot => {
        if (isSameDay(parseISO(ot.date), day)) {
          items.push({
            userId: ot.userId,
            userName: memberMap.get(ot.userId) || 'Unknown',
            type: 'ot',
            detail: `${ot.startTime} - ${ot.endTime} (${ot.hoursCount.toFixed(1)}h)`,
          });
        }
      });

      return { date: day, items };
    });
  }

  // Check for leave alerts (>50% team off same day)
  static getLeaveAlerts(managerId: string): LeaveAlert[] {
    const members = this.getTeamMembers(managerId);
    const memberIds = members.map(m => m.id);
    const memberMap = new Map(members.map(m => [m.id, m.fullName]));
    const totalMembers = members.length;

    if (totalMembers === 0) return [];

    // Get all pending + approved leaves
    const allLeaves = LeaveService.getAll().filter(
      l => memberIds.includes(l.userId) && (l.status === 'approved' || l.status === 'pending')
    );

    // Group by date
    const dateMap = new Map<string, Set<string>>();
    
    allLeaves.forEach(leave => {
      const startDate = parseISO(leave.startDate);
      const endDate = parseISO(leave.endDate);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, new Set());
        }
        dateMap.get(dateKey)!.add(leave.userId);
      });
    });

    // Find dates with >50% off
    const alerts: LeaveAlert[] = [];
    dateMap.forEach((userIds, dateKey) => {
      const count = userIds.size;
      const percentage = (count / totalMembers) * 100;
      
      if (percentage >= 50) {
        const employees = Array.from(userIds).map(id => memberMap.get(id) || 'Unknown');
        alerts.push({
          date: dateKey,
          dateFormatted: format(parseISO(dateKey), 'dd/MM/yyyy (EEEE)', { locale: vi }),
          count,
          percentage: Math.round(percentage),
          employees,
        });
      }
    });

    return alerts.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get all pending requests (leaves + OT) for team
  static getPendingRequests(managerId: string): PendingRequest[] {
    const members = this.getTeamMembers(managerId);
    const memberIds = members.map(m => m.id);
    const memberMap = new Map(members.map(m => [m.id, m.fullName]));

    const pendingLeaves = LeaveService.getPendingRequests().filter(
      l => memberIds.includes(l.userId)
    );

    const pendingOT = OvertimeService.getPendingRequests().filter(
      ot => memberIds.includes(ot.userId)
    );

    const requests: PendingRequest[] = [];

    // Map leaves
    pendingLeaves.forEach(leave => {
      const leaveTypeMap: Record<string, string> = {
        annual: 'Nghỉ phép năm',
        sick: 'Nghỉ ốm',
        unpaid: 'Nghỉ không lương',
      };
      requests.push({
        id: leave.id,
        userId: leave.userId,
        userName: memberMap.get(leave.userId) || 'Unknown',
        type: 'leave',
        date: `${format(parseISO(leave.startDate), 'dd/MM/yyyy')} - ${format(parseISO(leave.endDate), 'dd/MM/yyyy')}`,
        duration: `${leave.daysCount} ngày`,
        reason: leave.reason,
        status: 'pending',
        createdAt: leave.createdAt,
        original: leave,
      });
    });

    // Map OT
    pendingOT.forEach(ot => {
      requests.push({
        id: ot.id,
        userId: ot.userId,
        userName: memberMap.get(ot.userId) || 'Unknown',
        type: 'ot',
        date: format(parseISO(ot.date), 'dd/MM/yyyy'),
        duration: `${ot.hoursCount.toFixed(1)} giờ`,
        reason: ot.reason,
        status: 'pending',
        createdAt: ot.createdAt,
        original: ot,
      });
    });

    // Sort by createdAt
    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get approval history for manager
  static getApprovalHistory(managerId: string): PendingRequest[] {
    const approvedLeaves = LeaveService.getAll().filter(
      l => l.approverId === managerId && l.status !== 'pending'
    );

    const approvedOT = OvertimeService.getAll().filter(
      ot => ot.approverId === managerId && ot.status !== 'pending'
    );

    const requests: PendingRequest[] = [];

    // Map leaves
    approvedLeaves.forEach(leave => {
      const user = UserService.getById(leave.userId);
      requests.push({
        id: leave.id,
        userId: leave.userId,
        userName: user?.fullName || 'Unknown',
        type: 'leave',
        date: `${format(parseISO(leave.startDate), 'dd/MM/yyyy')} - ${format(parseISO(leave.endDate), 'dd/MM/yyyy')}`,
        duration: `${leave.daysCount} ngày`,
        reason: leave.reason,
        status: 'pending', // Will be overwritten below
        createdAt: leave.updatedAt,
        original: leave,
      });
    });

    // Map OT
    approvedOT.forEach(ot => {
      const user = UserService.getById(ot.userId);
      requests.push({
        id: ot.id,
        userId: ot.userId,
        userName: user?.fullName || 'Unknown',
        type: 'ot',
        date: format(parseISO(ot.date), 'dd/MM/yyyy'),
        duration: `${ot.hoursCount.toFixed(1)} giờ`,
        reason: ot.reason,
        status: 'pending',
        createdAt: ot.createdAt,
        original: ot,
      });
    });

    // Sort by updatedAt/createdAt (most recent first)
    return requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}
