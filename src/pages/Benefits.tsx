import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  GraduationCap, 
  Car, 
  Coffee,
  Gift,
  Dumbbell,
  Laptop,
  CreditCard
} from 'lucide-react';

const benefits = [
  {
    id: 1,
    icon: Heart,
    title: 'Bảo hiểm sức khỏe',
    description: 'Bảo hiểm sức khỏe toàn diện cho bạn và gia đình',
    status: 'active',
    details: 'Gói Premium - Bao gồm khám chữa bệnh, nha khoa, mắt',
  },
  {
    id: 2,
    icon: GraduationCap,
    title: 'Học phí đào tạo',
    description: 'Hỗ trợ học phí cho các khóa học nâng cao kỹ năng',
    status: 'active',
    details: 'Tối đa 20,000,000đ/năm',
  },
  {
    id: 3,
    icon: Car,
    title: 'Phụ cấp đi lại',
    description: 'Hỗ trợ chi phí di chuyển hàng tháng',
    status: 'active',
    details: '500,000đ/tháng',
  },
  {
    id: 4,
    icon: Coffee,
    title: 'Phụ cấp ăn trưa',
    description: 'Hỗ trợ chi phí ăn trưa hàng ngày',
    status: 'active',
    details: '50,000đ/ngày làm việc',
  },
  {
    id: 5,
    icon: Dumbbell,
    title: 'Thẻ gym',
    description: 'Thẻ thành viên phòng gym đối tác',
    status: 'active',
    details: 'California Fitness - Không giới hạn',
  },
  {
    id: 6,
    icon: Laptop,
    title: 'Thiết bị làm việc',
    description: 'Laptop và phụ kiện làm việc',
    status: 'active',
    details: 'MacBook Pro M3 + Màn hình 27"',
  },
  {
    id: 7,
    icon: Gift,
    title: 'Quà sinh nhật',
    description: 'Quà tặng nhân dịp sinh nhật',
    status: 'pending',
    details: 'Voucher 1,000,000đ',
  },
  {
    id: 8,
    icon: CreditCard,
    title: 'Thẻ tín dụng công ty',
    description: 'Thẻ tín dụng cho chi phí công tác',
    status: 'inactive',
    details: 'Dành cho cấp quản lý trở lên',
  },
];

export default function Benefits() {
  const { user } = useAuth();

  if (!user) return null;

  const activeBenefits = benefits.filter(b => b.status === 'active').length;

  return (
    <MainLayout 
      title="Phúc lợi"
      subtitle="Xem các chính sách phúc lợi của công ty dành cho bạn"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Phúc lợi' }
      ]}
    >
      <div className="space-y-6">
        {/* Summary */}
        <Card className="shadow-card bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Tổng quan phúc lợi</h3>
                <p className="text-muted-foreground">
                  Bạn đang được hưởng <span className="text-primary font-semibold">{activeBenefits}</span> phúc lợi
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={benefit.id} 
                className={`shadow-card transition-all hover:shadow-card-hover ${
                  benefit.status === 'inactive' ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      benefit.status === 'active' 
                        ? 'bg-primary/10' 
                        : benefit.status === 'pending'
                        ? 'bg-warning/10'
                        : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        benefit.status === 'active' 
                          ? 'text-primary' 
                          : benefit.status === 'pending'
                          ? 'text-warning'
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{benefit.title}</CardTitle>
                    </div>
                  </div>
                  <Badge 
                    className={
                      benefit.status === 'active' 
                        ? 'bg-success/10 text-success hover:bg-success/20' 
                        : benefit.status === 'pending'
                        ? 'bg-warning/10 text-warning hover:bg-warning/20'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {benefit.status === 'active' ? 'Đang áp dụng' : benefit.status === 'pending' ? 'Chờ kích hoạt' : 'Không khả dụng'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {benefit.description}
                  </p>
                  <div className="text-sm font-medium bg-muted/50 rounded-lg p-2">
                    {benefit.details}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Note */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              <strong>Lưu ý:</strong> Một số phúc lợi có thể yêu cầu điều kiện về thâm niên hoặc cấp bậc. 
              Vui lòng liên hệ phòng HR để biết thêm chi tiết.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
