import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PayslipService } from '@/services/PayslipService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { Payslip } from '@/types';

export default function Payroll() {
  const { user } = useAuth();
  const payslips = user ? PayslipService.getByUserId(user.id) : [];
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(
    payslips[0] || null
  );
  const [showComparison, setShowComparison] = useState(false);

  if (!user) return null;

  const comparison = selectedPayslip 
    ? PayslipService.compareWithPrevious(selectedPayslip) 
    : [];

  const handleDownload = () => {
    if (selectedPayslip) {
      PayslipService.generatePDF(selectedPayslip);
      toast.success('Đã tải phiếu lương');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' đ';
  };

  const getDiffIcon = (diff: number) => {
    if (diff > 0) return <ArrowUpRight className="h-4 w-4 text-success" />;
    if (diff < 0) return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <MainLayout 
      title="Bảng lương"
      subtitle="Xem chi tiết bảng lương và phiếu lương hàng tháng"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Bảng lương' }
      ]}
    >
      <div className="space-y-6">
        {/* Period Selector */}
        <Card className="shadow-card">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Kỳ lương:</Label>
              <Select 
                value={selectedPayslip?.id || ''} 
                onValueChange={(id) => setSelectedPayslip(payslips.find(p => p.id === id) || null)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn kỳ lương" />
                </SelectTrigger>
                <SelectContent>
                  {payslips.map((payslip) => (
                    <SelectItem key={payslip.id} value={payslip.id}>
                      {payslip.periodLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowComparison(!showComparison)}
                disabled={comparison.length === 0}
              >
                {showComparison ? 'Ẩn so sánh' : 'So sánh tháng trước'}
              </Button>
              <Button onClick={handleDownload} className="gap-2" disabled={!selectedPayslip}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedPayslip ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left - Salary Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Net Salary Card */}
              <Card className="shadow-card bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80 mb-1">Thực nhận</p>
                      <div className="text-4xl font-bold">
                        {formatCurrency(selectedPayslip.netSalary)}
                      </div>
                      <p className="text-sm opacity-80 mt-2">
                        Kỳ: {selectedPayslip.periodLabel}
                      </p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                      <Wallet className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Income Section */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Thu nhập
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Lương cơ bản</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Làm thêm giờ (OT)</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.overtime)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Thưởng</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.bonus)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Phụ cấp</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.allowances)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-success/5 rounded-lg px-3 -mx-3">
                      <span className="font-semibold">Tổng thu nhập</span>
                      <span className="font-bold text-success">
                        {formatCurrency(
                          selectedPayslip.baseSalary + 
                          selectedPayslip.overtime + 
                          selectedPayslip.bonus + 
                          selectedPayslip.allowances
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deductions Section */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    Khấu trừ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">BHXH</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(selectedPayslip.socialInsurance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">BHYT</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(selectedPayslip.healthInsurance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Thuế TNCN</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(selectedPayslip.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-muted-foreground">Khác</span>
                      <span className="font-medium text-destructive">
                        -{formatCurrency(selectedPayslip.deductions)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-destructive/5 rounded-lg px-3 -mx-3">
                      <span className="font-semibold">Tổng khấu trừ</span>
                      <span className="font-bold text-destructive">
                        -{formatCurrency(
                          selectedPayslip.socialInsurance + 
                          selectedPayslip.healthInsurance + 
                          selectedPayslip.tax + 
                          selectedPayslip.deductions
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right - Comparison & History */}
            <div className="space-y-6">
              {/* Comparison */}
              {showComparison && comparison.length > 0 && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">So sánh tháng trước</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {comparison.map((item) => (
                      <div key={item.field} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{item.field}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.previous)} → {formatCurrency(item.current)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getDiffIcon(item.diff)}
                          <span className={`text-sm font-medium ${
                            item.diff > 0 ? 'text-success' : item.diff < 0 ? 'text-destructive' : ''
                          }`}>
                            {item.diff > 0 ? '+' : ''}{formatCurrency(item.diff)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Payslip Status */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Trạng thái</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                      {selectedPayslip.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ngày thanh toán</span>
                    <span className="font-medium">
                      {selectedPayslip.paidDate 
                        ? new Date(selectedPayslip.paidDate).toLocaleDateString('vi-VN')
                        : '--'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Lịch sử</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payslips.slice(0, 5).map((payslip) => (
                      <button
                        key={payslip.id}
                        onClick={() => setSelectedPayslip(payslip)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          selectedPayslip?.id === payslip.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div className="h-10 w-10 rounded bg-destructive/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{payslip.periodLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(payslip.netSalary)}
                          </p>
                        </div>
                        {payslip.status === 'paid' && (
                          <Badge variant="outline" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Chưa có dữ liệu bảng lương</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
