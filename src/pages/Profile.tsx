import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { PayslipService } from '@/services/PayslipService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  Info, 
  Download, 
  Edit2, 
  Eye, 
  MapPin,
  Briefcase,
  Building,
  Calendar,
  FileText,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  if (!user) return null;

  const payslips = PayslipService.getByUserId(user.id).slice(0, 3);
  const nextPayDate = '30/11';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveContact = () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    // Validate phone
    const phoneRegex = /^[0-9\s]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      toast.error('Số điện thoại không hợp lệ');
      return;
    }

    // Update user
    UserService.update(user.id, { email, phone });
    updateUser({ email, phone });
    
    setIsEditing(false);
    toast.success('Cập nhật thông tin thành công');
  };

  const handleCancelEdit = () => {
    setEmail(user.email);
    setPhone(user.phone);
    setIsEditing(false);
  };

  const handleDownloadPayslip = (payslipId: string) => {
    const payslip = PayslipService.getById(payslipId);
    if (payslip) {
      PayslipService.generatePDF(payslip);
      toast.success('Đã tải phiếu lương');
    }
  };

  return (
    <MainLayout 
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin cá nhân và lương thưởng của bạn"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Hồ sơ cá nhân' }
      ]}
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-card" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{user.fullName}</h2>
                  <Badge className="bg-success/10 text-success hover:bg-success/20">
                    NHÂN VIÊN CHÍNH THỨC
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {user.position}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    ID: {user.employeeId}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-primary" />
                  Thông tin chung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ngày bắt đầu</p>
                    <p className="font-medium">
                      {new Date(user.startDate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phòng ban</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Quản lý trực tiếp</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.managerName ? getInitials(user.managerName) : 'N/A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.managerName || 'Không có'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Loại hợp đồng</p>
                    <p className="font-medium">{user.contractType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Payslips */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Phiếu lương gần đây
                </CardTitle>
                <Link to="/payroll">
                  <Button variant="link" className="text-primary p-0 h-auto">
                    Xem tất cả
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">KỲ LƯƠNG</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">NGÀY NHẬN</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">TRẠNG THÁI</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground text-right">TẢI VỀ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payslips.map((payslip) => (
                        <tr key={payslip.id}>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-destructive/10">
                                <FileText className="h-4 w-4 text-destructive" />
                              </div>
                              <span className="font-medium">{payslip.periodLabel}</span>
                            </div>
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {payslip.paidDate 
                              ? new Date(payslip.paidDate).toLocaleDateString('vi-VN')
                              : '--'
                            }
                          </td>
                          <td className="py-4">
                            <Badge className="bg-success/10 text-success hover:bg-success/20">
                              Đã thanh toán
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDownloadPayslip(payslip.id)}
                            >
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Salary Card */}
            <Card className="shadow-card bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium opacity-90">
                    <Building className="h-4 w-4" />
                    Mức lương cơ bản
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {user.baseSalary.toLocaleString('vi-VN')} đ
                </div>
                <p className="text-sm opacity-80 mb-4">MỖI THÁNG</p>
                <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/20">
                  <span className="text-sm opacity-80">Ngày trả lương kế tiếp:</span>
                  <span className="font-semibold">{nextPayDate}</span>
                </div>
                <p className="text-xs opacity-60 mt-2">* Chi tiết xem tại Payslip</p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  Liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email cá nhân</Label>
                      <div className="flex gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground mt-3" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <div className="flex gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground mt-3" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveContact} className="flex-1 gap-1">
                        <Check className="h-4 w-4" />
                        Lưu
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} className="flex-1 gap-1">
                        <X className="h-4 w-4" />
                        Hủy
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email cá nhân</p>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Cập nhật thông tin
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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
