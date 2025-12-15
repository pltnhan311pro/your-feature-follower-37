import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { LeaveService } from '@/services/LeaveService';
import { PayslipService } from '@/services/PayslipService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  FileText, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const leaveBalance = UserService.getLeaveBalance(user.id);
  const pendingLeaves = LeaveService.getByUserId(user.id).filter(l => l.status === 'pending');
  const latestPayslip = PayslipService.getLatestByUserId(user.id);

  const remainingAnnual = leaveBalance 
    ? leaveBalance.annualTotal - leaveBalance.annualUsed 
    : 0;

  return (
    <MainLayout 
      title="Trang chủ"
      subtitle={`Xin chào, ${user.fullName}!`}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ngày phép còn lại
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{remainingAnnual} ngày</div>
              <p className="text-xs text-muted-foreground">
                Tổng: {leaveBalance?.annualTotal || 0} | Đã dùng: {leaveBalance?.annualUsed || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đơn chờ duyệt
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves.length}</div>
              <p className="text-xs text-muted-foreground">
                Đang chờ quản lý phê duyệt
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lương tháng này
              </CardTitle>
              <Wallet className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestPayslip 
                  ? `${(latestPayslip.netSalary / 1000000).toFixed(1)}M`
                  : '--'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {latestPayslip ? `Kỳ: ${latestPayslip.periodLabel}` : 'Chưa có dữ liệu'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Phòng ban
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{user.department.split(' ')[0]}</div>
              <p className="text-xs text-muted-foreground truncate">
                {user.position}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link to="/leave">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Xin nghỉ phép</div>
                    <div className="text-xs text-muted-foreground">Tạo đơn xin nghỉ mới</div>
                  </div>
                </Button>
              </Link>
              <Link to="/payroll">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <FileText className="h-5 w-5 text-success" />
                  <div className="text-left">
                    <div className="font-medium">Xem phiếu lương</div>
                    <div className="text-xs text-muted-foreground">Kiểm tra bảng lương</div>
                  </div>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <FileText className="h-5 w-5 text-info" />
                  <div className="text-left">
                    <div className="font-medium">Cập nhật hồ sơ</div>
                    <div className="text-xs text-muted-foreground">Chỉnh sửa thông tin</div>
                  </div>
                </Button>
              </Link>
              <Link to="/overtime">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <Clock className="h-5 w-5 text-warning" />
                  <div className="text-left">
                    <div className="font-medium">Đăng ký OT</div>
                    <div className="text-xs text-muted-foreground">Làm thêm giờ</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Leave Requests */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Đơn nghỉ phép gần đây</CardTitle>
              <Link to="/leave">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingLeaves.length > 0 || LeaveService.getByUserId(user.id).length > 0 ? (
                <div className="space-y-3">
                  {LeaveService.getByUserId(user.id).slice(0, 3).map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">
                          {leave.startDate === leave.endDate 
                            ? new Date(leave.startDate).toLocaleDateString('vi-VN')
                            : `${new Date(leave.startDate).toLocaleDateString('vi-VN')} - ${new Date(leave.endDate).toLocaleDateString('vi-VN')}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.leaveType === 'annual' ? 'Phép năm' : leave.leaveType === 'sick' ? 'Nghỉ ốm' : 'Không lương'}
                          {' • '}{leave.daysCount} ngày
                        </p>
                      </div>
                      <Badge 
                        variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}
                        className={
                          leave.status === 'approved' 
                            ? 'bg-success/10 text-success hover:bg-success/20' 
                            : leave.status === 'pending'
                            ? 'bg-warning/10 text-warning hover:bg-warning/20'
                            : ''
                        }
                      >
                        {leave.status === 'approved' ? 'Đã duyệt' : leave.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Chưa có đơn nghỉ phép nào
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="shadow-card bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-foreground">Cần hỗ trợ?</h3>
              <p className="text-sm text-muted-foreground">
                Liên hệ bộ phận HR nếu thông tin sai hoặc cần trợ giúp
              </p>
            </div>
            <Button variant="outline">
              Liên hệ HR
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
