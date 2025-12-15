import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle,
  Calendar,
  FileText,
  ArrowRight
} from 'lucide-react';
import { ManagerService, TeamStats, TeamCalendarItem, LeaveAlert } from '@/services/ManagerService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [calendar, setCalendar] = useState<TeamCalendarItem[]>([]);
  const [alerts, setAlerts] = useState<LeaveAlert[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    setStats(ManagerService.getTeamStats(user.id));
    setCalendar(ManagerService.getTeamCalendar(user.id));
    setAlerts(ManagerService.getLeaveAlerts(user.id));
    setPendingCount(ManagerService.getPendingRequests(user.id).length);
  };

  if (!user) return null;

  return (
    <MainLayout
      title="Manager Dashboard"
      subtitle="Quản lý team và duyệt đơn"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Manager Dashboard' }
      ]}
    >
      <div className="space-y-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <Alert key={index} variant="destructive" className="border-warning bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">Cảnh báo nhiều người nghỉ cùng ngày</AlertTitle>
                <AlertDescription className="text-warning/80">
                  <strong>{alert.dateFormatted}</strong>: {alert.count} nhân viên ({alert.percentage}% team) nghỉ cùng ngày
                  <br />
                  <span className="text-sm">Nhân viên: {alert.employees.join(', ')}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Pending Approval Badge */}
        {pendingCount > 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <FileText className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Đơn chờ duyệt</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Bạn có <strong>{pendingCount}</strong> đơn cần duyệt</span>
              <Link to="/manager/approvals">
                <Button variant="outline" size="sm" className="gap-2">
                  Duyệt ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Team Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng nhân viên
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats?.totalMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Trong team</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đang hoạt động
              </CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats?.activeMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Thử việc
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats?.probationMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Probation</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nghỉ việc
              </CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.resignedMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Resigned</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Calendar */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lịch team tuần này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {calendar.map((day, index) => (
                <div 
                  key={index} 
                  className="min-h-[120px] rounded-lg border p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {format(day.date, 'EEE', { locale: vi })}
                  </div>
                  <div className="text-sm font-bold mb-2">
                    {format(day.date, 'dd/MM')}
                  </div>
                  <div className="space-y-1">
                    {day.items.slice(0, 3).map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className={`text-xs p-1 rounded truncate ${
                          item.type === 'leave' 
                            ? 'bg-warning/10 text-warning border border-warning/20' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                        title={`${item.userName} - ${item.detail}`}
                      >
                        <span className="font-medium">{item.userName.split(' ').pop()}</span>
                        <span className="ml-1 opacity-75">
                          {item.type === 'leave' ? '🏖️' : '⏰'}
                        </span>
                      </div>
                    ))}
                    {day.items.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{day.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/manager/approvals">
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Duyệt đơn</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingCount > 0 ? `${pendingCount} đơn chờ duyệt` : 'Không có đơn chờ'}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/manager/history">
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Lịch sử duyệt</h3>
                  <p className="text-sm text-muted-foreground">Xem lịch sử duyệt đơn</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-success transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/manager/team">
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Users className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Danh sách team</h3>
                  <p className="text-sm text-muted-foreground">{stats?.totalMembers || 0} thành viên</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground group-hover:text-secondary-foreground transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
