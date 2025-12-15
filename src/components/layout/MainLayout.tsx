import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, breadcrumbs, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64">
        <Header breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} />
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
