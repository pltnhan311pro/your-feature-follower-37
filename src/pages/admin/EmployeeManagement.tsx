import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { HRService } from '@/services/HRService';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { EmployeeForm } from '@/components/admin/EmployeeForm';
import { EmployeeDetail } from '@/components/admin/EmployeeDetail';

export default function EmployeeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    probationEmployees: 0,
    resignedEmployees: 0,
    departmentStats: [] as { name: string; count: number }[],
  });

  const loadData = async () => {
    const filters: { department?: string; status?: string } = {};
    if (departmentFilter !== 'all') filters.department = departmentFilter;
    if (statusFilter !== 'all') filters.status = statusFilter;

    const [data, hrStats, allEmployees] = await Promise.all([
      HRService.searchEmployees(searchQuery, filters),
      HRService.getHRStats(),
      HRService.getAllEmployees(),
    ]);
    setEmployees(data);
    setStats(hrStats);
    setDepartments([...new Set(allEmployees.map(e => e.department))]);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, departmentFilter, statusFilter]);

  const handleCreateEmployee = async (data: Omit<User, 'id' | 'employeeId'>) => {
    if (!user) return;
    await HRService.createEmployee(data, { id: user.id, name: user.fullName });
    toast({ title: 'Thành công', description: 'Đã tạo hồ sơ nhân viên mới' });
    setIsFormOpen(false);
    loadData();
  };

  const handleUpdateEmployee = async (data: Partial<User>) => {
    if (!user || !editingEmployee) return;
    await HRService.updateEmployee(editingEmployee.id, data, { id: user.id, name: user.fullName });
    toast({ title: 'Thành công', description: 'Đã cập nhật hồ sơ nhân viên' });
    setEditingEmployee(null);
    setIsFormOpen(false);
    loadData();
  };

  const handleDeleteEmployee = async (employee: User) => {
    if (!user) return;
    await HRService.softDeleteEmployee(employee.id, { id: user.id, name: user.fullName });
    toast({ title: 'Thành công', description: 'Đã đánh dấu nhân viên nghỉ việc' });
    loadData();
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

  return (
    <MainLayout title="Quản lý nhân viên" breadcrumbs={[{ label: 'HR Admin' }, { label: 'Nhân viên' }]}>
      {/* Stats Cards */}
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

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, mã nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="probation">Thử việc</SelectItem>
                <SelectItem value="inactive">Nghỉ việc</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingEmployee(null); setIsFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  employee={editingEmployee}
                  onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
                  onCancel={() => { setIsFormOpen(false); setEditingEmployee(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã NV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono text-sm">{emp.employeeId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{getStatusBadge(emp.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedEmployee(emp); setIsDetailOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingEmployee(emp); setIsFormOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {emp.status !== 'inactive' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận nghỉ việc</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn đánh dấu nhân viên "{emp.fullName}" nghỉ việc? 
                                Hồ sơ sẽ được giữ lại nhưng nhân viên sẽ không thể đăng nhập.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(emp)}>
                                Xác nhận
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy nhân viên nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết nhân viên</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <EmployeeDetail employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
