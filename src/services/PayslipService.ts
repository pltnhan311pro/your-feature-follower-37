// Payslip Service - manages payslip CRUD operations (Supabase version)
// Maps to localStorage key: hr_portal_payslips
import { Payslip } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Helper to convert DB row to Payslip
const mapDbToPayslip = (row: any): Payslip => ({
  id: row.id,
  userId: row.user_id,
  period: row.period,
  periodLabel: row.period_label,
  baseSalary: Number(row.base_salary),
  overtime: Number(row.overtime),
  bonus: Number(row.bonus),
  allowances: Number(row.allowances),
  socialInsurance: Number(row.social_insurance),
  healthInsurance: Number(row.health_insurance),
  tax: Number(row.tax),
  deductions: Number(row.deductions),
  netSalary: Number(row.net_salary),
  status: row.status as Payslip['status'],
  paidDate: row.paid_date,
  createdAt: row.created_at,
});

export class PayslipService {
  static async getAll(): Promise<Payslip[]> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .order('period', { ascending: false });
    
    if (error) {
      console.error('Error fetching payslips:', error);
      return [];
    }
    return (data || []).map(mapDbToPayslip);
  }

  static async getById(id: string): Promise<Payslip | null> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToPayslip(data);
  }

  static async getByUserId(userId: string): Promise<Payslip[]> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('user_id', userId)
      .order('period', { ascending: false });
    
    if (error) return [];
    return (data || []).map(mapDbToPayslip);
  }

  static async getLatestByUserId(userId: string): Promise<Payslip | null> {
    const payslips = await this.getByUserId(userId);
    return payslips[0] || null;
  }

  static async create(data: Omit<Payslip, 'id' | 'createdAt'>): Promise<Payslip | null> {
    const { data: inserted, error } = await supabase
      .from('payslips')
      .insert({
        user_id: data.userId,
        period: data.period,
        period_label: data.periodLabel,
        base_salary: data.baseSalary,
        overtime: data.overtime,
        bonus: data.bonus,
        allowances: data.allowances,
        social_insurance: data.socialInsurance,
        health_insurance: data.healthInsurance,
        tax: data.tax,
        deductions: data.deductions,
        net_salary: data.netSalary,
        status: data.status,
        paid_date: data.paidDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payslip:', error);
      return null;
    }
    return mapDbToPayslip(inserted);
  }

  static async update(id: string, updates: Partial<Payslip>): Promise<Payslip | null> {
    const dbUpdates: any = {};
    if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
    if (updates.overtime !== undefined) dbUpdates.overtime = updates.overtime;
    if (updates.bonus !== undefined) dbUpdates.bonus = updates.bonus;
    if (updates.allowances !== undefined) dbUpdates.allowances = updates.allowances;
    if (updates.socialInsurance !== undefined) dbUpdates.social_insurance = updates.socialInsurance;
    if (updates.healthInsurance !== undefined) dbUpdates.health_insurance = updates.healthInsurance;
    if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
    if (updates.deductions !== undefined) dbUpdates.deductions = updates.deductions;
    if (updates.netSalary !== undefined) dbUpdates.net_salary = updates.netSalary;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paidDate !== undefined) dbUpdates.paid_date = updates.paidDate;

    const { data, error } = await supabase
      .from('payslips')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payslip:', error);
      return null;
    }
    return mapDbToPayslip(data);
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('payslips')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async getByPeriod(userId: string, period: string): Promise<Payslip | null> {
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToPayslip(data);
  }

  static async compareWithPrevious(payslip: Payslip): Promise<{ field: string; current: number; previous: number; diff: number }[]> {
    const allPayslips = await this.getByUserId(payslip.userId);
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
