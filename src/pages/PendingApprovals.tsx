import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import { 
  Check, 
  X, 
  CheckCheck, 
  Filter, 
  Calendar,
  Clock,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { ManagerService, PendingRequest } from '@/services/ManagerService';
import { LeaveService } from '@/services/LeaveService';
import { OvertimeService } from '@/services/OvertimeService';
import { LeaveRequest, OvertimeRequest } from '@/types';

type FilterType = 'all' | 'leave' | 'ot';
type SortBy = 'createdAt' | 'userName';

export default function PendingApprovals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<PendingRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = () => {
    if (!user) return;
    setRequests(ManagerService.getPendingRequests(user.id));
    setSelectedIds(new Set());
  };

  const filteredRequests = requests
    .filter(r => filterType === 'all' || r.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.userName.localeCompare(b.userName);
    });

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleApprove = (request: PendingRequest) => {
    let result;
    if (request.type === 'leave') {
      result = LeaveService.approve(request.id);
    } else {
      result = OvertimeService.approve(request.id);
    }

    if (result) {
      toast.success(`Đã duyệt đơn của ${request.userName}`);
      loadRequests();
    } else {
      toast.error('Có lỗi xảy ra khi duyệt đơn');
    }
  };

  const handleRejectClick = (request: PendingRequest) => {
    setRejectingRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectingRequest) return;

    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    let result;
    if (rejectingRequest.type === 'leave') {
      result = LeaveService.reject(rejectingRequest.id);
    } else {
      result = OvertimeService.reject(rejectingRequest.id, rejectReason);
    }

    if (result) {
      toast.success(`Đã từ chối đơn của ${rejectingRequest.userName}`);
      setRejectDialogOpen(false);
      setRejectingRequest(null);
      setRejectReason('');
      loadRequests();
    } else {
      toast.error('Có lỗi xảy ra khi từ chối đơn');
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return;

    const selectedRequests = requests.filter(r => selectedIds.has(r.id));
    let successCount = 0;

    selectedRequests.forEach(request => {
      let result;
      if (request.type === 'leave') {
        result = LeaveService.approve(request.id);
      } else {
        result = OvertimeService.approve(request.id);
      }
      if (result) successCount++;
    });

    toast.success(`Đã duyệt ${successCount}/${selectedIds.size} đơn`);
    setBulkApproveDialogOpen(false);
    loadRequests();
  };

  if (!user) return null;

  return (
    <MainLayout
      title="Duyệt đơn"
      subtitle="Danh sách đơn nghỉ phép và OT chờ duyệt"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Manager Dashboard', href: '/manager' },
        { label: 'Duyệt đơn' }
      ]}
    >
      <div className="space-y-6">
        {/* Filters & Actions */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter by type */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="leave">Nghỉ phép</SelectItem>
                    <SelectItem value="ot">Làm thêm giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Ngày tạo</SelectItem>
                    <SelectItem value="userName">Tên nhân viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              <div className="ml-auto flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button 
                    onClick={() => setBulkApproveDialogOpen(true)}
                    className="gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Duyệt {selectedIds.size} đơn
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Đơn chờ duyệt ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4">
                        <Checkbox
                          checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">NHÂN VIÊN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LOẠI ĐƠN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI GIAN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI LƯỢNG</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LÝ DO</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground text-right">HÀNH ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-4 pr-4">
                          <Checkbox
                            checked={selectedIds.has(request.id)}
                            onCheckedChange={(checked) => handleSelect(request.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-4">
                          <span className="font-medium">{request.userName}</span>
                        </td>
                        <td className="py-4">
                          <Badge 
                            className={
                              request.type === 'leave' 
                                ? 'bg-warning/10 text-warning hover:bg-warning/20' 
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }
                          >
                            {request.type === 'leave' ? (
                              <><Calendar className="h-3 w-3 mr-1" /> Nghỉ phép</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> OT</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <span className="text-sm">{request.date}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-medium">{request.duration}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                            {request.reason}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleApprove(request)}
                            >
                              <Check className="h-4 w-4" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleRejectClick(request)}
                            >
                              <X className="h-4 w-4" />
                              Từ chối
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không có đơn chờ duyệt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn</DialogTitle>
            <DialogDescription>
              Từ chối đơn của <strong>{rejectingRequest?.userName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <AlertDialog open={bulkApproveDialogOpen} onOpenChange={setBulkApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận duyệt hàng loạt</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn duyệt <strong>{selectedIds.size}</strong> đơn đã chọn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApprove}>
              Duyệt tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
