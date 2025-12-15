import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  History, 
  Filter, 
  Calendar,
  Clock,
  Check,
  X,
  Search
} from 'lucide-react';
import { ManagerService, PendingRequest } from '@/services/ManagerService';
import { LeaveRequest, OvertimeRequest } from '@/types';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

type FilterType = 'all' | 'leave' | 'ot';
type FilterStatus = 'all' | 'approved' | 'rejected';

export default function ApprovalHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<PendingRequest[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = () => {
    if (!user) return;
    setHistory(ManagerService.getApprovalHistory(user.id));
  };

  const filteredHistory = history
    .filter(r => {
      // Type filter
      if (filterType !== 'all' && r.type !== filterType) return false;

      // Status filter
      const status = (r.original as LeaveRequest | OvertimeRequest).status;
      if (filterStatus !== 'all' && status !== filterStatus) return false;

      // Date filter
      if (dateFrom || dateTo) {
        const createdDate = parseISO(r.createdAt);
        if (dateFrom && createdDate < startOfDay(parseISO(dateFrom))) return false;
        if (dateTo && createdDate > endOfDay(parseISO(dateTo))) return false;
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!r.userName.toLowerCase().includes(term) && 
            !r.reason.toLowerCase().includes(term)) {
          return false;
        }
      }

      return true;
    });

  if (!user) return null;

  return (
    <MainLayout
      title="Lịch sử duyệt"
      subtitle="Xem lịch sử các đơn đã duyệt"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Manager Dashboard', href: '/manager' },
        { label: 'Lịch sử duyệt' }
      ]}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter by type */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    <SelectItem value="leave">Nghỉ phép</SelectItem>
                    <SelectItem value="ot">Làm thêm giờ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by status */}
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả TT</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>

              {/* Date range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-[140px]"
                  placeholder="Từ ngày"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[140px]"
                  placeholder="Đến ngày"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Lịch sử duyệt ({filteredHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 text-sm font-medium text-muted-foreground">NHÂN VIÊN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LOẠI ĐƠN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI GIAN</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">THỜI LƯỢNG</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">LÝ DO</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">TRẠNG THÁI</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground">NGÀY DUYỆT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHistory.map((request) => {
                      const original = request.original as LeaveRequest | OvertimeRequest;
                      const isApproved = original.status === 'approved';
                      
                      return (
                        <tr key={request.id} className="hover:bg-muted/50 transition-colors">
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
                          <td className="py-4">
                            <Badge 
                              className={
                                isApproved
                                  ? 'bg-success/10 text-success hover:bg-success/20' 
                                  : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                              }
                            >
                              {isApproved ? (
                                <><Check className="h-3 w-3 mr-1" /> Đã duyệt</>
                              ) : (
                                <><X className="h-3 w-3 mr-1" /> Từ chối</>
                              )}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(request.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có lịch sử duyệt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
