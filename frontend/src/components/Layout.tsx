/**
 * Shared UI components — Layout, Navbar, Sidebar, Cards, etc.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Brain,
  Home,
  LogOut,
  Route,
  Settings,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import { getRatingBadgeColor } from '@/types';

// ── Layout ──────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/problems', label: 'Problems', icon: BookOpen },
  { path: '/paths', label: 'Practice Paths', icon: Route },
  { path: '/stats', label: 'Statistics', icon: BarChart3 },
  { path: '/coaching', label: 'AI Coach', icon: Brain },
  { path: '/profile', label: 'Profile', icon: Settings },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <Route className="h-7 w-7 text-brand-600" />
        <span className="text-lg font-bold text-gray-900">CP Path Builder</span>
      </div>
      <nav className="mt-4 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Navbar ───────────────────────────────────────────────────────

function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="lg:hidden">
        <Route className="h-6 w-6 text-brand-600" />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {user?.cf_handle && (
          <span className="text-sm text-gray-500">
            CF: <span className="font-medium text-gray-700">{user.cf_handle}</span>
            {user.estimated_rating && (
              <span className={clsx('ml-1', getRatingBadgeColor(user.estimated_rating).split(' ')[1])}>
                ({user.estimated_rating})
              </span>
            )}
          </span>
        )}
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{user?.username}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}

// ── Reusable Card ───────────────────────────────────────────────

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'brand',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={clsx('rounded-lg p-3', colorMap[color] ?? colorMap.brand)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Rating Badge ────────────────────────────────────────────────

export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-gray-400">Unrated</span>;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getRatingBadgeColor(rating)
      )}
    >
      {rating}
    </span>
  );
}

// ── Tag Chip ────────────────────────────────────────────────────

export function TagChip({
  name,
  selected,
  onClick,
}: {
  name: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        selected
          ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {name}
    </button>
  );
}

// ── Progress Bar ────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  color = 'brand',
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={clsx('h-full rounded-full transition-all', colorMap[color] ?? colorMap.brand)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Loading Spinner ─────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={clsx(
          'animate-spin rounded-full border-2 border-gray-300 border-t-brand-600',
          sizeMap[size]
        )}
      />
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
