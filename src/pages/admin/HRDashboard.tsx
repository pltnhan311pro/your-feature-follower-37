import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HRService } from '@/services/HRService';
import { LeaveService } from '@/services/LeaveService';
import { OvertimeService } from '@/services/OvertimeService';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Clock, 
  Calendar, 
  ArrowRight, ClipboardCheck, Building
} from 'lucide-react';

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    probationEmployees: 0,
    resignedEmployees: 0,
    departmentStats: [] as { name: string; count: number }[],
  });
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingOTs, setPendingOTs] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const [hrStats, leaves, ots] = await Promise.all([
        HRService.getHRStats(),
        LeaveService.getPendingRequests(),
        OvertimeService.getPendingRequests(),
      ]);
      setStats(hrStats);
      setPendingLeaves(leaves.length);
      setPendingOTs(ots.length);
    };
    loadData();
  }, []);

  const quickActions = [
    { label: 'Quản lý nhân viên', icon: Users, path: '/admin/employees', color: 'bg-primary/10 text-primary' },
    { label: 'Tính lương', icon: Clock, path: '/admin/payroll', color: 'bg-success/10 text-success' },
    { label: 'Duyệt đơn', icon: ClipboardCheck, path: '/manager/approvals', color: 'bg-warning/10 text-warning' },
    { label: 'Xem team', icon: Building, path: '/manager/team', color: 'bg-info/10 text-info' },
  ];

  return (
    <MainLayout title="HR Admin Dashboard" breadcrumbs={[{ label: 'HR Admin' }]}>
      {/* Welcome Banner */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Xin chào, {user?.fullName}!</h2>
              <p className="text-muted-foreground mt-1">
                Bạn có {pendingLeaves + pendingOTs} đơn chờ duyệt
              </p>
            </div>
            <Link to="/manager/approvals">
              <Button>
                Xem đơn chờ duyệt
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng nhân viên</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đang làm việc</p>
              <p className="text-2xl font-bold">{stats.activeEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Thử việc</p>
              <p className="text-2xl font-bold">{stats.probationEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <UserX className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nghỉ việc</p>
              <p className="text-2xl font-bold">{stats.resignedEmployees}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.label}
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Phân bổ theo phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.departmentStats.map((dept) => {
                const percentage = Math.round((dept.count / stats.totalEmployees) * 100) || 0;
                return (
                  <div key={dept.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{dept.name}</span>
                      <span className="font-medium">{dept.count} người ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.departmentStats.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Đơn nghỉ phép chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-primary">{pendingLeaves}</p>
              <p className="text-muted-foreground mt-1">đơn chờ xử lý</p>
              <Link to="/manager/approvals" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Xem chi tiết
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Đơn OT chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-warning">{pendingOTs}</p>
              <p className="text-muted-foreground mt-1">đơn chờ xử lý</p>
              <Link to="/manager/approvals" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Xem chi tiết
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
