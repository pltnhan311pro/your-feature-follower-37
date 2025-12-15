// Payslip Service - manages payslip CRUD operations
import { Payslip } from '@/types';
import { StorageService } from './StorageService';

const PAYSLIPS_KEY = 'payslips';

export class PayslipService {
  static getAll(): Payslip[] {
    return StorageService.getAll<Payslip>(PAYSLIPS_KEY);
  }

  static getById(id: string): Payslip | null {
    return StorageService.findById<Payslip>(PAYSLIPS_KEY, id);
  }

  static getByUserId(userId: string): Payslip[] {
    const payslips = StorageService.findByField<Payslip>(PAYSLIPS_KEY, 'userId', userId);
    return payslips.sort((a, b) => b.period.localeCompare(a.period));
  }

  static getLatestByUserId(userId: string): Payslip | null {
    const payslips = this.getByUserId(userId);
    return payslips[0] || null;
  }

  static create(data: Omit<Payslip, 'id' | 'createdAt'>): Payslip {
    const payslip: Payslip = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    StorageService.addItem(PAYSLIPS_KEY, payslip);
    return payslip;
  }

  static update(id: string, updates: Partial<Payslip>): Payslip | null {
    return StorageService.updateItem<Payslip>(PAYSLIPS_KEY, id, updates);
  }

  static delete(id: string): boolean {
    return StorageService.deleteItem<Payslip>(PAYSLIPS_KEY, id);
  }

  static getByPeriod(userId: string, period: string): Payslip | null {
    const payslips = this.getByUserId(userId);
    return payslips.find(p => p.period === period) || null;
  }

  static compareWithPrevious(payslip: Payslip): { field: string; current: number; previous: number; diff: number }[] {
    const allPayslips = this.getByUserId(payslip.userId);
    const currentIndex = allPayslips.findIndex(p => p.id === payslip.id);
    
    if (currentIndex === -1 || currentIndex >= allPayslips.length - 1) {
      return [];
    }

    const previous = allPayslips[currentIndex + 1];
    
    return [
      { field: 'Lương cơ bản', current: payslip.baseSalary, previous: previous.baseSalary, diff: payslip.baseSalary - previous.baseSalary },
      { field: 'OT', current: payslip.overtime, previous: previous.overtime, diff: payslip.overtime - previous.overtime },
      { field: 'Thưởng', current: payslip.bonus, previous: previous.bonus, diff: payslip.bonus - previous.bonus },
      { field: 'Thực nhận', current: payslip.netSalary, previous: previous.netSalary, diff: payslip.netSalary - previous.netSalary },
    ];
  }

  static generatePDF(payslip: Payslip): void {
    // In a real app, this would generate an actual PDF
    // For now, we'll create a simple text representation
    const content = `
PHIẾU LƯƠNG - ${payslip.periodLabel}
================================

Lương cơ bản: ${payslip.baseSalary.toLocaleString('vi-VN')} đ
Làm thêm giờ: ${payslip.overtime.toLocaleString('vi-VN')} đ
Thưởng: ${payslip.bonus.toLocaleString('vi-VN')} đ
Phụ cấp: ${payslip.allowances.toLocaleString('vi-VN')} đ

Khấu trừ:
- BHXH: ${payslip.socialInsurance.toLocaleString('vi-VN')} đ
- BHYT: ${payslip.healthInsurance.toLocaleString('vi-VN')} đ
- Thuế TNCN: ${payslip.tax.toLocaleString('vi-VN')} đ
- Khác: ${payslip.deductions.toLocaleString('vi-VN')} đ

THỰC NHẬN: ${payslip.netSalary.toLocaleString('vi-VN')} đ
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${payslip.period}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
