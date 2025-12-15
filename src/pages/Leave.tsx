import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { LeaveService } from '@/services/LeaveService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Plus, 
  Clock,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { LeaveRequest, LeaveType, LeaveBalance } from '@/types';

export default function Leave() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [reason, setReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [requests, balance] = await Promise.all([
          LeaveService.getByUserId(user.id),
          UserService.getLeaveBalance(user.id),
        ]);
        setLeaveRequests(requests);
        setLeaveBalance(balance);
      } catch (error) {
        console.error('Error loading leave data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (!user) return null;

  const remainingAnnual = leaveBalance 
    ? leaveBalance.annualTotal - leaveBalance.annualUsed 
    : 0;
  const remainingSick = leaveBalance 
    ? leaveBalance.sickTotal - leaveBalance.sickUsed 
    : 0;

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setLeaveType('annual');
    setReason('');
    setEditingRequest(null);
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    // Check team conflict
    const conflictCount = await LeaveService.checkTeamLeaveConflict(user.id, startDate, endDate);
    if (conflictCount >= 2) {
      toast.warning(`Lưu ý: Có ${conflictCount} người trong team đã nghỉ trong khoảng thời gian này`);
    }

    const result = await LeaveService.create({
      userId: user.id,
      startDate,
      endDate,
      leaveType,
      reason,
    });

    if ('error' in result) {
      toast.error(result.error as string);
      return;
    }

    const updatedRequests = await LeaveService.getByUserId(user.id);
    setLeaveRequests(updatedRequests);
    setIsDialogOpen(false);
    resetForm();
    toast.success('Đã gửi đơn xin nghỉ phép');
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setStartDate(request.startDate);
    setEndDate(request.endDate);
    setLeaveType(request.leaveType);
    setReason(request.reason);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingRequest) return;
    if (!startDate || !endDate || !reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    const daysCount = LeaveService.calculateDays(startDate, endDate);
    
    await LeaveService.update(editingRequest.id, {
      startDate,
      endDate,
      leaveType,
      reason,
      daysCount,
    });

    const updatedRequests = await LeaveService.getByUserId(user.id);
    setLeaveRequests(updatedRequests);
    setIsEditDialogOpen(false);
    resetForm();
    toast.success('Đã cập nhật đơn nghỉ phép');
  };

  const handleDelete = async (requestId: string) => {
    await LeaveService.delete(requestId);
    const updatedRequests = await LeaveService.getByUserId(user.id);
    setLeaveRequests(updatedRequests);
    toast.success('Đã xóa đơn nghỉ phép');
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Đã duyệt</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Chờ duyệt</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Từ chối</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    switch (type) {
      case 'annual': return 'Phép năm';
      case 'sick': return 'Nghỉ ốm';
      case 'unpaid': return 'Không lương';
    }
  };

  return (
    <MainLayout 
      title="Nghỉ phép"
      subtitle="Quản lý đơn xin nghỉ phép và xem số ngày phép còn lại"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Nghỉ phép' }
      ]}
    >
      <div className="space-y-6">
        {/* Leave Balance Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Phép năm còn lại
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{remainingAnnual}</div>
              <p className="text-xs text-muted-foreground">
                Đã dùng: {leaveBalance?.annualUsed || 0} / {leaveBalance?.annualTotal || 0} ngày
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${((leaveBalance?.annualUsed || 0) / (leaveBalance?.annualTotal || 12)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nghỉ ốm còn lại
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{remainingSick}</div>
              <p className="text-xs text-muted-foreground">
                Đã dùng: {leaveBalance?.sickUsed || 0} / {leaveBalance?.sickTotal || 0} ngày
              </p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning rounded-full transition-all" 
                  style={{ width: `${((leaveBalance?.sickUsed || 0) / (leaveBalance?.sickTotal || 7)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Không lương
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leaveBalance?.unpaidUsed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Số ngày đã nghỉ không lương
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Table */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo đơn nghỉ phép
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo đơn xin nghỉ phép</DialogTitle>
                  <DialogDescription>
                    Điền thông tin để gửi đơn xin nghỉ phép
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Từ ngày</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Đến ngày</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Loại nghỉ phép</Label>
                    <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Phép năm ({remainingAnnual} ngày còn lại)</SelectItem>
                        <SelectItem value="sick">Nghỉ ốm ({remainingSick} ngày còn lại)</SelectItem>
                        <SelectItem value="unpaid">Không lương</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Lý do nghỉ</Label>
                    <Textarea
                      id="reason"
                      placeholder="Nhập lý do xin nghỉ phép..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Hủy
                  </Button>
                  <Button onClick={handleSubmit}>
                    Gửi đơn
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {leaveRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI GIAN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LOẠI NGHỈ</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">SỐ NGÀY</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LÝ DO</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">TRẠNG THÁI</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">NGƯỜI DUYỆT</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leaveRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-4">
                          <div className="font-medium">
                            {new Date(request.startDate).toLocaleDateString('vi-VN')}
                          </div>
                          {request.startDate !== request.endDate && (
                            <div className="text-xs text-muted-foreground">
                              đến {new Date(request.endDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <span className="text-sm">{getLeaveTypeLabel(request.leaveType)}</span>
                        </td>
                        <td className="py-4">
                          <span className="font-medium">{request.daysCount}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {request.reason}
                          </span>
                        </td>
                        <td className="py-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {request.approverName || '--'}
                        </td>
                        <td className="py-4">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(request)}
                                title="Sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc muốn xóa đơn nghỉ phép này? Hành động này không thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(request.id)}>
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có đơn nghỉ phép nào</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Tạo đơn đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa đơn nghỉ phép</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin đơn xin nghỉ phép
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Từ ngày</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">Đến ngày</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLeaveType">Loại nghỉ phép</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Phép năm</SelectItem>
                    <SelectItem value="sick">Nghỉ ốm</SelectItem>
                    <SelectItem value="unpaid">Không lương</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editReason">Lý do nghỉ</Label>
                <Textarea
                  id="editReason"
                  placeholder="Nhập lý do xin nghỉ phép..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
                Hủy
              </Button>
              <Button onClick={handleUpdateSubmit}>
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
