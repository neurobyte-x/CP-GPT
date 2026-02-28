/**
 * App shell — collapsible dark sidebar + topbar + content area.
 * Based on UI reference design, wired to real auth store.
 */

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  Route,
  Search,
  Code2,
  BarChart3,
  Settings,
  Bell,
  Zap,
  ChevronLeft,
  ChevronRight,
  User,
  Flame,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/practice', label: 'Practice Paths', icon: Route },
  { to: '/app/problems', label: 'Problem Explorer', icon: Code2 },
  { to: '/app/coach', label: 'AI Coach', icon: Brain, highlight: true },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold">
            CPCoach<span className="text-primary">.ai</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? item.highlight
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              } ${item.highlight && !collapsed ? 'relative' : ''}`
            }
          >
            <item.icon className={`w-5 h-5 shrink-0 ${item.highlight ? 'text-primary' : ''}`} />
            {!collapsed && (
              <span className={item.highlight ? 'font-semibold' : 'font-normal'}>{item.label}</span>
            )}
            {item.highlight && !collapsed && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded font-semibold">
                AI
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border/50 space-y-1">
        <NavLink
          to="/app/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full ${
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`
          }
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 shrink-0 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[260px] h-full bg-sidebar border-r border-border/50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems, topics..."
                className="pl-9 pr-4 py-1.5 text-sm bg-secondary/60 border border-border/50 rounded-lg w-64 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
              />
              <kbd
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border/50"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Ctrl+K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak indicator (placeholder — will wire to real data later) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
              <Flame className="w-4 h-4 text-neon-orange" />
              <span className="text-sm font-semibold text-neon-orange">
                {user?.cf_handle ? 'Active' : 'No CF'}
              </span>
            </div>

            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>

            <button
              onClick={() => navigate('/app/coach')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary rounded-lg border border-primary/20 hover:bg-primary/25 transition-all text-sm"
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">Ask Coach</span>
            </button>

            <button
              onClick={() => navigate('/app/profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center"
              title={user?.username ?? 'Profile'}
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
