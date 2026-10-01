'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Ticket, FileText, User, LogOut, Menu, X,
  Building2, Users, Settings, BarChart3, Shield, BookOpen, AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { clearAuth, getDisplayName, type AuthUser } from '@/lib/auth';
import { api } from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

function getNavItems(role: string): NavItem[] {
  if (role === 'STUDENT') return [
    { label: 'Dashboard',    href: '/student/dashboard',     icon: LayoutDashboard },
    { label: 'My Tickets',   href: '/student/tickets',       icon: Ticket },
    { label: 'Applications', href: '/student/applications',  icon: FileText },
    { label: 'Profile',      href: '/student/profile',       icon: User },
  ];
  if (role === 'STAFF') return [
    { label: 'Dashboard',    href: '/staff/dashboard',       icon: LayoutDashboard },
    { label: 'Tickets',      href: '/staff/tickets',         icon: Ticket },
    { label: 'Applications', href: '/staff/applications',    icon: FileText },
    { label: 'Profile',      href: '/staff/profile',         icon: User },
  ];
  // ADMIN
  return [
    { label: 'Dashboard',    href: '/admin/dashboard',       icon: LayoutDashboard },
    { label: 'Departments',  href: '/admin/departments',     icon: Building2 },
    { label: 'Issues',       href: '/admin/issues',          icon: AlertCircle },
    { label: 'Staff',        href: '/admin/staff',           icon: Shield },
    { label: 'Students',     href: '/admin/students',        icon: Users },
    { label: 'Tickets',      href: '/admin/tickets',         icon: Ticket },
    { label: 'Applications', href: '/admin/applications',    icon: FileText },
    { label: 'Reports',      href: '/admin/reports',         icon: BarChart3 },
    { label: 'Audit Logs',   href: '/admin/audit-logs',      icon: BookOpen },
    { label: 'Fee Config',   href: '/admin/fees',            icon: Settings },
  ];
}

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = getNavItems(user.role);
  const displayName = getDisplayName(user);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {}
    clearAuth();
    router.push('/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <div className="h-8 w-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">UoK</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">UoK Portal</p>
          <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role.toLowerCase()} panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors group',
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent group">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user.student?.seatNumber ?? user.email ?? user.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-card flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-72 bg-card border-r h-full">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 p-1 rounded hover:bg-accent"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-14 border-b px-4 gap-3 bg-card flex-shrink-0">
          <button
            className="lg:hidden p-1.5 rounded hover:bg-accent"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground hidden sm:block">
              University of Karachi — Student Portal
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
