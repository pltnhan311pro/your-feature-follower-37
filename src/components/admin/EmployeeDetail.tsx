import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Payslip, LeaveBalance } from '@/types';
import { HRService, EmployeeHistoryEntry } from '@/services/HRService';
import { UserService } from '@/services/UserService';
import { PayslipService } from '@/services/PayslipService';
import { User as UserIcon, Briefcase, FileText, Clock, Calendar, Building, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface EmployeeDetailProps {
  employee: User;
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const [history, setHistory] = useState<EmployeeHistoryEntry[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [historyData, balanceData, payslipData] = await Promise.all([
        HRService.getEmployeeHistory(employee.id),
        UserService.getLeaveBalance(employee.id),
        PayslipService.getByUserId(employee.id),
      ]);
      setHistory(historyData);
      setLeaveBalance(balanceData);
      setPayslips(payslipData.slice(0, 3));
    };
    loadData();
  }, [employee.id]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Đang làm việc</Badge>;
      case 'probation':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Thử việc</Badge>;
      case 'inactive':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Nghỉ việc</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'created': return <UserIcon className="h-4 w-4" />;
      case 'promoted': return <Briefcase className="h-4 w-4" />;
      case 'department_change': return <Building className="h-4 w-4" />;
      case 'status_change': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="info">Thông tin</TabsTrigger>
        <TabsTrigger value="timeline">Lịch sử</TabsTrigger>
        <TabsTrigger value="payroll">Lương</TabsTrigger>
      </TabsList>

      {/* Info Tab */}
      <TabsContent value="info" className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {getInitials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{employee.fullName}</h3>
            <p className="text-muted-foreground">{employee.position}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-muted-foreground">{employee.employeeId}</span>
              {getStatusBadge(employee.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Điện thoại:</span>
                <span>{employee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CMND/CCCD:</span>
                <span>{employee.idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Địa điểm:</span>
                <span>{employee.location}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Thông tin công việc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phòng ban:</span>
                <span>{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chức vụ:</span>
                <span>{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày vào làm:</span>
                <span>{employee.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loại HĐ:</span>
                <span className="text-right">{employee.contractType}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {leaveBalance && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Số ngày phép</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{leaveBalance.annualTotal - leaveBalance.annualUsed}</p>
                  <p className="text-xs text-muted-foreground">Phép năm còn lại</p>
                </div>
                <div className="p-3 bg-warning/5 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{leaveBalance.sickTotal - leaveBalance.sickUsed}</p>
                  <p className="text-xs text-muted-foreground">Phép bệnh còn lại</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{leaveBalance.unpaidUsed}</p>
                  <p className="text-xs text-muted-foreground">Nghỉ không lương</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Timeline Tab */}
      <TabsContent value="timeline">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Lịch sử thay đổi</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử thay đổi</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative pl-10">
                      <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getHistoryIcon(entry.type)}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="font-medium">{entry.description}</p>
                        {entry.previousValue && entry.newValue && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="line-through">{entry.previousValue}</span>
                            {' → '}
                            <span className="text-foreground">{entry.newValue}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          <span>•</span>
                          <span>bởi {entry.performedByName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payroll Tab */}
      <TabsContent value="payroll">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Lương cơ bản: {employee.baseSalary.toLocaleString('vi-VN')} đ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payslips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có phiếu lương</p>
            ) : (
              <div className="space-y-3">
                {payslips.map((payslip) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{payslip.periodLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {payslip.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {payslip.netSalary.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
