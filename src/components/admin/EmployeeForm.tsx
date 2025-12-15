import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole, UserStatus } from '@/types';
import { HRService } from '@/services/HRService';

interface EmployeeFormProps {
  employee?: User | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    fullName: employee?.fullName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    idNumber: employee?.idNumber || '',
    department: employee?.department || '',
    position: employee?.position || '',
    location: employee?.location || 'Hồ Chí Minh, VN',
    startDate: employee?.startDate || new Date().toISOString().split('T')[0],
    contractType: employee?.contractType || 'Toàn thời gian (Không xác định thời hạn)',
    baseSalary: employee?.baseSalary || 0,
    role: employee?.role || 'employee' as UserRole,
    status: employee?.status || 'active' as UserStatus,
    managerId: employee?.managerId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const managers = HRService.getAllEmployees().filter(e => e.role === 'manager' || e.role === 'admin');
  const departments = [
    'Phát triển sản phẩm (Product)',
    'Nhân sự (HR)',
    'Tài chính (Finance)',
    'Marketing',
    'Kinh doanh (Sales)',
    'Vận hành (Operations)',
  ];

  const contractTypes = [
    'Toàn thời gian (Không xác định thời hạn)',
    'Toàn thời gian (Có thời hạn)',
    'Bán thời gian',
    'Thử việc',
    'Hợp đồng dịch vụ',
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'Số CMND/CCCD không được để trống';
    }
    if (!formData.department) {
      newErrors.department = 'Phòng ban không được để trống';
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Chức vụ không được để trống';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày vào làm không được để trống';
    }
    if (formData.baseSalary <= 0) {
      newErrors.baseSalary = 'Lương cơ bản phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const managerData = managers.find(m => m.id === formData.managerId);
    
    onSubmit({
      ...formData,
      managerName: managerData?.fullName,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ tên *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@company.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0909 123 456"
          />
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <Label htmlFor="idNumber">Số CMND/CCCD *</Label>
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            placeholder="079123456789"
          />
          {errors.idNumber && <p className="text-xs text-destructive">{errors.idNumber}</p>}
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label>Phòng ban *</Label>
          <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phòng ban" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label htmlFor="position">Chức vụ *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Senior Developer"
          />
          {errors.position && <p className="text-xs text-destructive">{errors.position}</p>}
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Ngày vào làm *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
        </div>

        {/* Contract Type */}
        <div className="space-y-2">
          <Label>Loại hợp đồng</Label>
          <Select value={formData.contractType} onValueChange={(value) => setFormData({ ...formData, contractType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại hợp đồng" />
            </SelectTrigger>
            <SelectContent>
              {contractTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Salary */}
        <div className="space-y-2">
          <Label htmlFor="baseSalary">Lương cơ bản (VNĐ) *</Label>
          <Input
            id="baseSalary"
            type="number"
            value={formData.baseSalary}
            onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
            placeholder="25000000"
          />
          {errors.baseSalary && <p className="text-xs text-destructive">{errors.baseSalary}</p>}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label>Vai trò</Label>
          <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Nhân viên</SelectItem>
              <SelectItem value="manager">Quản lý</SelectItem>
              <SelectItem value="admin">HR Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Trạng thái</Label>
          <Select value={formData.status} onValueChange={(value: UserStatus) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang làm việc</SelectItem>
              <SelectItem value="probation">Thử việc</SelectItem>
              <SelectItem value="inactive">Nghỉ việc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manager */}
        <div className="space-y-2">
          <Label>Quản lý trực tiếp</Label>
          <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn quản lý" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Không có</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>{manager.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Địa điểm làm việc</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Hồ Chí Minh, VN"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">
          {employee ? 'Cập nhật' : 'Tạo nhân viên'}
        </Button>
      </div>
    </form>
  );
}
