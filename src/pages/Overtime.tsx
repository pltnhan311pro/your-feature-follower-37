import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Clock, Plus, Calendar, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { OvertimeRequest } from '@/types';
import { OvertimeService } from '@/services/OvertimeService';

export default function Overtime() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<OvertimeRequest | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [otRequests, setOtRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const requests = await OvertimeService.getByUserId(user.id);
        setOtRequests(requests);
      } catch (error) {
        console.error('Error loading overtime data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (!user) return null;

  const calculateHours = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const resetForm = () => {
    setDate('');
    setStartTime('');
    setEndTime('');
    setReason('');
    setEditingRequest(null);
  };

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const hours = calculateHours(startTime, endTime);
    if (hours <= 0) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    const result = await OvertimeService.create({
      userId: user.id,
      date,
      startTime,
      endTime,
      reason,
    });

    if ('error' in result) {
      toast.error(result.error as string);
      return;
    }

    const updatedRequests = await OvertimeService.getByUserId(user.id);
    setOtRequests(updatedRequests);
    setIsDialogOpen(false);
    resetForm();
    toast.success('Đã gửi đơn đăng ký OT');
  };

  const handleEdit = (request: OvertimeRequest) => {
    setEditingRequest(request);
    setDate(request.date);
    setStartTime(request.startTime);
    setEndTime(request.endTime);
    setReason(request.reason);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!editingRequest) return;
    if (!date || !startTime || !endTime || !reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const hours = calculateHours(startTime, endTime);
    if (hours <= 0) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    await OvertimeService.update(editingRequest.id, {
      date,
      startTime,
      endTime,
      reason,
      hoursCount: hours,
    });

    const updatedRequests = await OvertimeService.getByUserId(user.id);
    setOtRequests(updatedRequests);
    setIsEditDialogOpen(false);
    resetForm();
    toast.success('Đã cập nhật đơn OT');
  };

  const handleDelete = async (requestId: string) => {
    await OvertimeService.delete(requestId);
    const updatedRequests = await OvertimeService.getByUserId(user.id);
    setOtRequests(updatedRequests);
    toast.success('Đã xóa đơn OT');
  };

  const totalHoursThisMonth = otRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.hoursCount, 0);

  const pendingRequests = otRequests.filter(r => r.status === 'pending').length;

  return (
    <MainLayout 
      title="Làm thêm giờ"
      subtitle="Đăng ký và theo dõi giờ làm thêm (OT)"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Làm thêm giờ' }
      ]}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng giờ OT tháng này
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalHoursThisMonth.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Đã được duyệt</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đơn chờ duyệt
              </CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Đang chờ quản lý duyệt</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng đơn
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{otRequests.length}</div>
              <p className="text-xs text-muted-foreground">Từ đầu năm</p>
            </CardContent>
          </Card>
        </div>

        {/* OT Requests Table */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Danh sách đơn OT</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Đăng ký OT
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Đăng ký làm thêm giờ</DialogTitle>
                  <DialogDescription>
                    Điền thông tin để đăng ký OT
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Ngày OT</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Giờ bắt đầu</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Giờ kết thúc</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  {startTime && endTime && (
                    <p className="text-sm text-muted-foreground">
                      Tổng thời gian: {calculateHours(startTime, endTime).toFixed(1)} giờ
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Lý do OT</Label>
                    <Textarea
                      id="reason"
                      placeholder="Nhập lý do làm thêm giờ..."
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
            {otRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">NGÀY</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI GIAN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">SỐ GIỜ</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LÝ DO</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">TRẠNG THÁI</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {otRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-4">
                          <span className="font-medium">
                            {new Date(request.date).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm">
                            {request.startTime} - {request.endTime}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-medium">{request.hoursCount.toFixed(1)}h</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {request.reason}
                          </span>
                        </td>
                        <td className="py-4">
                          <Badge 
                            className={
                              request.status === 'approved' 
                                ? 'bg-success/10 text-success hover:bg-success/20' 
                                : request.status === 'pending'
                                ? 'bg-warning/10 text-warning hover:bg-warning/20'
                                : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            }
                          >
                            {request.status === 'approved' ? 'Đã duyệt' : request.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                          </Badge>
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
                                      Bạn có chắc muốn xóa đơn OT này? Hành động này không thể hoàn tác.
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
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có đơn OT nào</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Đăng ký OT đầu tiên
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa đơn OT</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin đơn đăng ký OT
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editDate">Ngày OT</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartTime">Giờ bắt đầu</Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndTime">Giờ kết thúc</Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              {startTime && endTime && (
                <p className="text-sm text-muted-foreground">
                  Tổng thời gian: {calculateHours(startTime, endTime).toFixed(1)} giờ
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="editReason">Lý do OT</Label>
                <Textarea
                  id="editReason"
                  placeholder="Nhập lý do làm thêm giờ..."
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
