import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, FileText, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  return (
    <aside className="sidebar-nav hidden md:flex flex-col w-64 h-full bg-surface border-r border-border-subtle shrink-0">
      <div className="p-6 flex items-center gap-2 text-brand-teal">
        <Sparkles size={24} />
        <span className="text-h2 font-bold tracking-tight text-text-primary">CleanVision</span>
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md',
                  'text-body font-medium transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-tint',
                  isActive
                    ? 'bg-brand-teal-tint text-brand-teal'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
