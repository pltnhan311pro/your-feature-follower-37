import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Calendar, Gift, Clock, FileText, Settings, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { path: '/', icon: Home, label: 'Trang chủ' },
  { path: '/profile', icon: User, label: 'Hồ sơ' },
  { path: '/leave', icon: Calendar, label: 'Nghỉ phép' },
  { path: '/payroll', icon: FileText, label: 'Bảng lương' },
  { path: '/overtime', icon: Clock, label: 'Làm thêm giờ' },
  { path: '/benefits', icon: Gift, label: 'Phúc lợi' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <CheckCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Portal HR</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu chính
          </p>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        {user && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-success">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.employeeId}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <NavLink
                to="/settings"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
                Cài đặt
              </NavLink>
              <button
                onClick={logout}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
