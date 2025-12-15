import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { ManagerService } from '@/services/ManagerService';
import { UserService } from '@/services/UserService';
import { User } from '@/types';

export default function TeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user]);

  const loadMembers = () => {
    if (!user) return;
    setMembers(ManagerService.getTeamMembers(user.id));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success">Đang làm việc</Badge>;
      case 'probation':
        return <Badge className="bg-warning/10 text-warning">Thử việc</Badge>;
      case 'inactive':
        return <Badge className="bg-destructive/10 text-destructive">Nghỉ việc</Badge>;
    }
  };

  const filteredMembers = members.filter(m => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return m.fullName.toLowerCase().includes(term) ||
           m.email.toLowerCase().includes(term) ||
           m.position.toLowerCase().includes(term);
  });

  if (!user) return null;

  return (
    <MainLayout
      title="Danh sách team"
      subtitle="Quản lý thành viên trong team"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Manager Dashboard', href: '/manager' },
        { label: 'Danh sách team' }
      ]}
    >
      <div className="space-y-6">
        {/* Search */}
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email hoặc vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Thành viên ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMembers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">{member.fullName}</h3>
                            {getStatusBadge(member.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {member.position}
                          </p>
                          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              {member.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" />
                              {member.phone}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              {member.location}
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              Mã NV: <span className="font-medium">{member.employeeId}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy thành viên nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
