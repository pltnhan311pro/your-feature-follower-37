import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { HRService, PayrollConfig, PayrollRun } from '@/services/HRService';
import { PayslipService } from '@/services/PayslipService';
import { useAuth } from '@/contexts/AuthContext';
import { Payslip, User } from '@/types';
import { Play, Settings, Download, Calculator, DollarSign, Users, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PayrollManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<PayrollConfig>>({});

  // Generate periods for last 12 months
  const periods = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: vi }),
    };
  });

  const loadData = async () => {
    const [runs, cfg, employees] = await Promise.all([
      HRService.getPayrollRuns(),
      HRService.getPayrollConfig(),
      HRService.getAllEmployees(),
    ]);
    setPayrollRuns(runs);
    setConfig(cfg);
    setConfigForm(cfg);
    setAllEmployees(employees);
  };

  useEffect(() => {
    loadData();
    if (!selectedPeriod && periods.length > 0) {
      setSelectedPeriod(periods[0].value);
    }
  }, []);

  useEffect(() => {
    const loadPayslips = async () => {
      if (selectedPeriod) {
        const allPayslips = await PayslipService.getAll();
        setPayslips(allPayslips.filter(p => p.period === selectedPeriod));
      }
    };
    loadPayslips();
  }, [selectedPeriod, payrollRuns]);

  const handleRunPayroll = async () => {
    if (!user || !selectedPeriod) return;
    
    setIsRunning(true);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = await HRService.runPayroll(selectedPeriod, { id: user.id, name: user.fullName });
    
    toast({
      title: 'Tính lương hoàn tất',
      description: `Đã tính lương cho ${result.totalEmployees} nhân viên. Tổng: ${result.totalNetSalary.toLocaleString('vi-VN')} đ`,
    });
    
    setIsRunning(false);
    loadData();
  };

  const handleSaveConfig = async () => {
    if (!user) return;
    await HRService.updatePayrollConfig(configForm, user.fullName);
    toast({ title: 'Thành công', description: 'Đã cập nhật cấu hình tính lương' });
    loadData();
  };

  const handleExportBank = async (bankFormat: 'ACB' | 'VCB') => {
    if (!selectedPeriod) return;
    
    const content = await HRService.exportBankFile(selectedPeriod, bankFormat);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_transfer_${selectedPeriod}_${bankFormat}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Xuất file thành công', description: `Đã tải file chuyển khoản ${bankFormat}` });
  };

  const currentRun = payrollRuns.find(r => r.period === selectedPeriod);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Hoàn tất</Badge>;
      case 'processing':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Đang xử lý</Badge>;
      default:
        return <Badge variant="outline">Chưa chạy</Badge>;
    }
  };

  return (
    <MainLayout title="Quản lý tính lương" breadcrumbs={[{ label: 'HR Admin' }, { label: 'Tính lương' }]}>
      <Tabs defaultValue="run" className="space-y-6">
        <TabsList>
          <TabsTrigger value="run">Chạy tính lương</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
        </TabsList>

        {/* Run Payroll Tab */}
        <TabsContent value="run" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Kỳ lương</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỳ lương" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRunPayroll} disabled={isRunning || !selectedPeriod}>
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tính lương...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Chạy tính lương
                    </>
                  )}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!currentRun || currentRun.status !== 'completed'}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Bank
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xuất file chuyển lương</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Chọn định dạng file phù hợp với ngân hàng của công ty:
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleExportBank('VCB')} variant="outline" className="h-20">
                          <div className="text-center">
                            <p className="font-semibold">Vietcombank</p>
                            <p className="text-xs text-muted-foreground">Format CSV</p>
                          </div>
                        </Button>
                        <Button onClick={() => handleExportBank('ACB')} variant="outline" className="h-20">
                          <div className="text-center">
                            <p className="font-semibold">ACB</p>
                            <p className="text-xs text-muted-foreground">Format TXT</p>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {currentRun && currentRun.status === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số nhân viên</p>
                    <p className="text-2xl font-bold">{currentRun.totalEmployees}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-warning/10">
                    <Calculator className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng lương Gross</p>
                    <p className="text-2xl font-bold">{currentRun.totalGrossSalary.toLocaleString('vi-VN')} đ</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success/10">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng lương Net</p>
                    <p className="text-2xl font-bold">{currentRun.totalNetSalary.toLocaleString('vi-VN')} đ</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payslips Table */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết bảng lương</CardTitle>
              <CardDescription>
                {currentRun ? getStatusBadge(currentRun.status) : 'Chưa chạy tính lương cho kỳ này'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payslips.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có dữ liệu lương cho kỳ này</p>
                  <p className="text-sm">Nhấn "Chạy tính lương" để tính lương</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead className="text-right">Lương cơ bản</TableHead>
                      <TableHead className="text-right">OT</TableHead>
                      <TableHead className="text-right">BHXH</TableHead>
                      <TableHead className="text-right">BHYT</TableHead>
                      <TableHead className="text-right">Thuế TNCN</TableHead>
                      <TableHead className="text-right">Thực nhận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((payslip) => {
                      const employee = allEmployees.find(e => e.id === payslip.userId);
                      return (
                        <TableRow key={payslip.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee?.fullName || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{employee?.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{payslip.baseSalary.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right">{payslip.overtime.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right text-destructive">-{payslip.socialInsurance.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right text-destructive">-{payslip.healthInsurance.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right text-destructive">-{payslip.tax.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">{payslip.netSalary.toLocaleString('vi-VN')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử chạy tính lương</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kỳ lương</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Số NV</TableHead>
                    <TableHead className="text-right">Tổng Net</TableHead>
                    <TableHead>Người chạy</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.periodLabel}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>{run.totalEmployees}</TableCell>
                      <TableCell className="text-right font-semibold">{run.totalNetSalary.toLocaleString('vi-VN')} đ</TableCell>
                      <TableCell>{run.runBy || '-'}</TableCell>
                      <TableCell>
                        {run.completedAt ? format(new Date(run.completedAt), 'dd/MM/yyyy HH:mm', { locale: vi }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payrollRuns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Chưa có lịch sử tính lương
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cấu hình công thức tính lương
              </CardTitle>
              <CardDescription>
                Cấu hình các tham số tính lương theo quy định hiện hành
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Hệ số làm thêm giờ (OT)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={configForm.otMultiplier || ''}
                    onChange={(e) => setConfigForm({ ...configForm, otMultiplier: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 1.5 (150%)</p>
                </div>

                <div className="space-y-2">
                  <Label>Tỷ lệ BHXH (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={(configForm.socialInsuranceRate || 0) * 100}
                    onChange={(e) => setConfigForm({ ...configForm, socialInsuranceRate: Number(e.target.value) / 100 })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 8%</p>
                </div>

                <div className="space-y-2">
                  <Label>Tỷ lệ BHYT (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={(configForm.healthInsuranceRate || 0) * 100}
                    onChange={(e) => setConfigForm({ ...configForm, healthInsuranceRate: Number(e.target.value) / 100 })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 1.5%</p>
                </div>

                <div className="space-y-2">
                  <Label>Tỷ lệ BHTN (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={(configForm.unemploymentInsuranceRate || 0) * 100}
                    onChange={(e) => setConfigForm({ ...configForm, unemploymentInsuranceRate: Number(e.target.value) / 100 })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 1%</p>
                </div>

                <div className="space-y-2">
                  <Label>Giảm trừ cá nhân (VNĐ)</Label>
                  <Input
                    type="number"
                    value={configForm.personalDeduction || ''}
                    onChange={(e) => setConfigForm({ ...configForm, personalDeduction: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 11.000.000 đ</p>
                </div>

                <div className="space-y-2">
                  <Label>Giảm trừ người phụ thuộc (VNĐ)</Label>
                  <Input
                    type="number"
                    value={configForm.dependentDeduction || ''}
                    onChange={(e) => setConfigForm({ ...configForm, dependentDeduction: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 4.400.000 đ / người</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveConfig}>
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
